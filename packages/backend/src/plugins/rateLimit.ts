import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import fastifyRateLimit from '@fastify/rate-limit'
import Redis from 'ioredis'

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis | null
  }
}

const PLAN_LIMITS: Record<string, number> = {
  FREE: 100,
  PRO: 1000,
  BUSINESS: 5000,
  ENTERPRISE: 10000,
}

export const rateLimitPlugin = fp(async (app: FastifyInstance) => {
  const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, { lazyConnect: true })
    : null

  if (redis) await redis.connect().catch(() => {})
  app.decorate('redis', redis)

  app.addHook('onClose', async () => {
    await redis?.quit().catch(() => {})
  })

  await app.register(fastifyRateLimit, {
    global: false, // apply per-route via config
    redis: redis ?? undefined,
    keyGenerator: (req) => {
      // Use userId if authenticated, else IP
      return (req as any).userId ?? req.ip
    },
    max: (req) => {
      const plan = (req as any).userPlan ?? 'FREE'
      return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE
    },
    timeWindow: '1 minute',
    errorResponseBuilder: (_req, context) => ({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${context.after}.`,
      limit: context.max,
    }),
  })
})
