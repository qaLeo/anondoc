import type { FastifyInstance } from 'fastify'
import { Plan } from '@prisma/client'
import {
  createCheckoutSession,
  cancelSubscription,
  handleStripeWebhook,
} from '../services/billingService.js'

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
