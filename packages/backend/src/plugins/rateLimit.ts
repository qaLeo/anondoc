import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import fastifyRateLimit from '@fastify/rate-limit'
import Redis from 'ioredis'

const PLAN_LIMITS: Record<string, number> = {
  FREE: 100,
  PRO: 1000,
  BUSINESS: 5000,
  ENTERPRISE: 10000,
}

export const rateLimitPlugin = fp(async (app: FastifyInstance) => {
  const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL)
    : undefined

  await app.register(fastifyRateLimit, {
    global: false, // apply per-route via config
    redis,
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
