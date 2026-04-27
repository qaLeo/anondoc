import type { FastifyInstance } from 'fastify'
import { getUsage, incrementUsage } from '../services/usageService.js'

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN
const CLEAR_OPTS = {
  path: '/auth/refresh',
  ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
}

export async function usageRoutes(app: FastifyInstance) {
  // GET /me/profile
  app.get('/profile', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, avatarUrl: true, plan: true, createdAt: true },
    })
    if (!user) return reply.status(404).send({ error: 'User not found' })
    reply.send(user)
  })

  // GET /me/usage
  app.get('/usage', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const usage = await getUsage(req.userId)
    reply.send(usage)
  })

  // POST /me/usage/track — called by frontend after local anonymization
  // Daily rate limit: FREE users → 25 docs/day (Redis TTL 86400)
  // PRO/BUSINESS/ENTERPRISE → unlimited (bypass Redis check)
  app.post('/usage/track', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: req.userId },
      select: { plan: true },
    })
    const plan = user?.plan ?? 'FREE'
    const isUnlimited = plan === 'PRO' || plan === 'BUSINESS' || plan === 'ENTERPRISE'

    if (!isUnlimited && app.redis) {
      const key = `ratelimit:user:${req.userId}`
      const count = await app.redis.incr(key)
      // Set TTL on first increment
      if (count === 1) await app.redis.expire(key, 86400)
      if (count > 25) {
        const ttl = await app.redis.ttl(key)
        return reply.status(429).send({
          error: 'rate_limit_exceeded',
          retry_after: ttl > 0 ? ttl : 86400,
          upgrade_url: '/pricing',
        })
      }
    }

    await incrementUsage(req.userId, 0)
    const usage = await getUsage(req.userId)
    reply.send(usage)
  })

  // DELETE /me/account — permanently delete the authenticated user's account
  app.delete('/account', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    await app.prisma.user.delete({ where: { id: req.userId } })
    reply
      .clearCookie('refreshToken', CLEAR_OPTS)
      .status(204).send()
  })
}
