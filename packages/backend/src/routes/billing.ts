import type { FastifyInstance } from 'fastify'
import { Plan } from '@prisma/client'
import {
  createCheckoutSession,
  cancelSubscription,
  handleStripeWebhook,
} from '../services/billingService.js'

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'mail.ru', 'yandex.ru',
  'hotmail.com', 'outlook.com', 'icloud.com', 'bk.ru',
  'inbox.ru', 'list.ru', 'rambler.ru',
])

const TRIAL_DAYS = 10

export async function billingRoutes(app: FastifyInstance) {
  // POST /billing/subscribe
  app.post('/subscribe', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { plan, returnUrl } = req.body as { plan: string; returnUrl: string }
    const planEnum = plan.toUpperCase() as Plan

    const session = await createCheckoutSession(req.userId, planEnum, returnUrl)
    reply.send({ url: session.url })
  })

  // POST /billing/trial — activate 10-day Pro trial (no card)
  app.post('/trial', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const user = await app.prisma.user.findUniqueOrThrow({ where: { id: req.userId } })

    if (user.trialUsed) {
      return reply.status(400).send({ error: 'TRIAL_ALREADY_USED' })
    }

    // Fraud protection: limit corporate domain trials to 10 per domain
    const domain = user.email.split('@')[1]?.toLowerCase() ?? ''
    if (!FREE_EMAIL_DOMAINS.has(domain)) {
      const domainTrialCount = await app.prisma.user.count({
        where: { email: { endsWith: `@${domain}` }, trialUsed: true },
      })
      if (domainTrialCount >= 10) {
        return reply.status(400).send({
          error: 'DOMAIN_TRIAL_LIMIT',
          message: 'лимит пробных периодов для вашей организации исчерпан',
        })
      }
    }

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

    await app.prisma.$transaction([
      app.prisma.user.update({
        where: { id: req.userId },
        data: { plan: Plan.PRO, trialUsed: true },
      }),
      app.prisma.subscription.upsert({
        where: { userId: req.userId },
        create: {
          userId: req.userId,
          plan: Plan.PRO,
          status: 'trialing',
          isTrial: true,
          trialEndsAt,
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEndsAt,
        },
        update: {
          plan: Plan.PRO,
          status: 'trialing',
          isTrial: true,
          trialEndsAt,
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEndsAt,
        },
      }),
    ])

    reply.send({ ok: true })
  })

  // POST /billing/cancel
  app.post('/cancel', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    await cancelSubscription(req.userId)
    reply.send({ ok: true })
  })

  // GET /billing/subscription
  app.get('/subscription', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const sub = await app.prisma.subscription.findUnique({
      where: { userId: req.userId },
    })
    reply.send(sub ?? { plan: 'FREE', status: 'none' })
  })

  // POST /billing/webhook/stripe — raw body needed for signature verification
  app.post('/webhook/stripe', {
    config: { rawBody: true },
  }, async (req, reply) => {
    const sig = req.headers['stripe-signature'] as string
    if (!sig) return reply.status(400).send({ error: 'Missing Stripe-Signature' })

    const result = await handleStripeWebhook(
      (req as any).rawBody as Buffer,
      sig,
    )
    reply.send(result)
  })
}
