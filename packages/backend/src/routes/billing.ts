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
    config: { rateLimit: { max: 10, timeWindow: '15 minutes', keyGenerator: (req) => req.ip } },
  }, async (req, reply) => {
    // Resolve domain outside transaction (read-only, no TOCTOU risk)
    const userSnap = await app.prisma.user.findUniqueOrThrow({
      where: { id: req.userId },
      select: { email: true, trialUsed: true },
    })
    const domain = userSnap.email.split('@')[1]?.toLowerCase() ?? ''
    const isCorporate = !FREE_EMAIL_DOMAINS.has(domain)

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

    try {
      await app.prisma.$transaction(async (tx) => {
        // Re-read trialUsed inside the transaction to prevent races
        const user = await tx.user.findUniqueOrThrow({
          where: { id: req.userId },
          select: { trialUsed: true },
        })
        if (user.trialUsed) throw Object.assign(new Error('TRIAL_ALREADY_USED'), { status: 400 })

        // Atomic domain-trial limit check for corporate addresses
        if (isCorporate) {
          const domainTrialCount = await tx.user.count({
            where: { email: { endsWith: `@${domain}` }, trialUsed: true },
          })
          if (domainTrialCount >= 10) {
            throw Object.assign(new Error('DOMAIN_TRIAL_LIMIT'), { status: 400 })
          }
        }

        await tx.user.update({
          where: { id: req.userId },
          data: { plan: Plan.PRO, trialUsed: true },
        })
        await tx.subscription.upsert({
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
        })
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg === 'TRIAL_ALREADY_USED') return reply.status(400).send({ error: 'TRIAL_ALREADY_USED' })
      if (msg === 'DOMAIN_TRIAL_LIMIT') {
        return reply.status(400).send({
          error: 'DOMAIN_TRIAL_LIMIT',
          message: 'лимит пробных периодов для вашей организации исчерпан',
        })
      }
      throw e
    }

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
