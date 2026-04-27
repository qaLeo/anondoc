import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  sendBusinessLeadEmail,
  sendBusinessAutoReply,
  sendWaitlistConfirmation,
} from '../../../services/emailService.js'

const BusinessLeadBody = z.object({
  companyName:    z.string().min(1).max(200),
  role:           z.string().min(1).max(100),
  country:        z.enum(['DE', 'FR', 'AT', 'CH', 'OTHER_EU', 'OTHER']),
  industry:       z.enum(['LAW', 'HEALTHCARE', 'PHARMA', 'HR', 'FINANCE', 'PUBLIC', 'OTHER']),
  expectedVolume: z.enum(['LT100', '100_1000', '1000_10000', 'GT10000']),
  email:          z.string().email().max(200),
  message:        z.string().max(2000).optional(),
})

const WaitlistBody = z.object({
  email:  z.string().email().max(200),
  locale: z.enum(['en', 'de', 'fr']).default('en'),
})

const CONTACT_RL_KEY = (ip: string) => `contact_lead:${ip}`
const CONTACT_RL_MAX = 3
const CONTACT_RL_WINDOW = 3600 // 1 hour

export async function contactRoutes(app: FastifyInstance) {
  // POST /api/contact/business
  app.post('/contact/business', async (req, reply) => {
    // IP-based rate limit: 3 requests / hour
    const ip = req.ip
    if (app.redis) {
      const key = CONTACT_RL_KEY(ip)
      const count = await app.redis.incr(key)
      if (count === 1) await app.redis.expire(key, CONTACT_RL_WINDOW)
      if (count > CONTACT_RL_MAX) {
        const ttl = await app.redis.ttl(key)
        return reply.status(429).send({
          error: 'rate_limit_exceeded',
          retry_after: ttl,
          message: 'Too many contact requests. Try again later.',
        })
      }
    }

    const body = BusinessLeadBody.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'validation_error', details: body.error.flatten() })
    }

    const lead = await app.prisma.businessLead.create({ data: body.data })

    // Fire-and-forget emails — don't block response on email delivery
    void Promise.all([
      sendBusinessLeadEmail(lead).catch((e: unknown) => app.log.error({ err: e }, 'business lead email failed')),
      sendBusinessAutoReply(lead.email, lead.companyName).catch((e: unknown) => app.log.error({ err: e }, 'business auto-reply failed')),
    ])

    reply.status(201).send({ ok: true, id: lead.id })
  })

  // POST /api/waitlist/pro
  app.post('/waitlist/pro', async (req, reply) => {
    const body = WaitlistBody.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'validation_error', details: body.error.flatten() })
    }

    await app.prisma.proWaitlist.upsert({
      where: { email: body.data.email },
      create: { email: body.data.email, locale: body.data.locale, source: 'pricing_page' },
      update: { locale: body.data.locale },
    })

    // Send confirmation — fire-and-forget
    void sendWaitlistConfirmation(body.data.email, body.data.locale)
      .catch((e: unknown) => app.log.error({ err: e }, 'waitlist confirmation email failed'))

    reply.status(201).send({ ok: true })
  })
}
