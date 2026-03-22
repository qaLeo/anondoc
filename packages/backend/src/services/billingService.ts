import Stripe from 'stripe'
import { PrismaClient, Plan } from '@prisma/client'

const prisma = new PrismaClient()

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

const STRIPE_PRICE_IDS: Partial<Record<Plan, string>> = {
  PRO: process.env.STRIPE_PRICE_PRO!,
  BUSINESS: process.env.STRIPE_PRICE_BUSINESS!,
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE!,
}

export async function createCheckoutSession(userId: string, plan: Plan, returnUrl: string) {
  const stripe = getStripe()
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { subscription: true },
  })

  let customerId = user.subscription?.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId } })
    customerId = customer.id
  }

  const priceId = STRIPE_PRICE_IDS[plan]
  if (!priceId) throw new Error('INVALID_PLAN')

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${returnUrl}?success=1`,
    cancel_url: `${returnUrl}?canceled=1`,
    metadata: { userId, plan },
  }, {
    idempotencyKey: `checkout-${userId}-${plan}`,
  })

  return session
}

export async function cancelSubscription(userId: string) {
  const stripe = getStripe()
  const sub = await prisma.subscription.findUnique({ where: { userId } })
  if (!sub?.stripeSubscriptionId) throw new Error('NO_SUBSCRIPTION')

  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  })
  await prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: true },
  })
}

export async function handleStripeWebhook(payload: Buffer, sig: string) {
  const stripe = getStripe()
  const event = stripe.webhooks.constructEvent(
    payload,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!,
  )

  switch (event.type) {
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id
      if (!subId) break

      const stripeSub = await stripe.subscriptions.retrieve(subId)
      const userId = stripeSub.metadata.userId
      const plan = (stripeSub.metadata.plan as Plan) ?? 'PRO'

      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { plan } }),
        prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan,
            status: 'active',
            stripeCustomerId: typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer.id,
            stripeSubscriptionId: subId,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          },
          update: {
            plan,
            status: 'active',
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: false,
          },
        }),
      ])
      break
    }

    case 'customer.subscription.deleted': {
      const stripeSub = event.data.object as Stripe.Subscription
      const userId = stripeSub.metadata.userId
      if (!userId) break

      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { plan: Plan.FREE } }),
        prisma.subscription.update({
          where: { userId },
          data: { status: 'canceled', plan: Plan.FREE },
        }),
      ])
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id
      if (!subId) break

      const stripeSub = await stripe.subscriptions.retrieve(subId)
      const userId = stripeSub.metadata.userId
      if (!userId) break

      await prisma.subscription.update({
        where: { userId },
        data: { status: 'past_due' },
      })
      break
    }
  }

  return { received: true }
}
