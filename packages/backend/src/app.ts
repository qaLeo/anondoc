import Fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'

import { authPlugin } from './plugins/auth.js'
import { rateLimitPlugin } from './plugins/rateLimit.js'
import { authRoutes } from './routes/auth.js'
import { usageRoutes } from './routes/usage.js'
import { billingRoutes } from './routes/billing.js'
import { anonymizeRoutes } from './routes/api/v1/anonymize.js'
import { deanonymizeRoutes } from './routes/api/v1/deanonymize.js'
import { keysRoutes } from './routes/api/v1/keys.js'
import { contactRoutes } from './routes/api/v1/contact.js'
import { adminRoutes } from './routes/admin.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      redact: {
        paths: [
          'req.headers.authorization',
          'req.body.password',
          'req.body.accessToken',
          'req.body.refreshToken',
        ],
        censor: '[REDACTED]',
      },
      transport: process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty' }
        : undefined,
    },
  })

  // CORS — registered before helmet so headers aren't overridden
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',').map(s => s.trim())
  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true)
      } else {
        cb(null, false)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    // When origin is rejected, @fastify/cors skips reply and falls through
    // to routing — which returns 404 since no OPTIONS routes exist.
    // Hook below catches all OPTIONS before routing and short-circuits them.
  })

  // Catch-all OPTIONS handler — must run before routes are matched.
  // @fastify/cors sets Access-Control-Allow-* headers via onRequest hook,
  // this just ensures preflight never hits a 404.
  app.addHook('onRequest', async (req, reply) => {
    if (req.method === 'OPTIONS') {
      await reply.status(204).send()
    }
  })

  // Security headers — disable CORP so cross-origin API responses aren't blocked
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
  await app.register(fastifyCookie)

  // JWT
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
    cookie: { cookieName: 'refreshToken', signed: false },
  })

  // Swagger (dev only)
  if (process.env.NODE_ENV !== 'production') {
    await app.register(fastifySwagger, {
      openapi: {
        info: { title: 'AnonDoc API', version: '1.0.0' },
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
          },
        },
      },
    })
    await app.register(fastifySwaggerUi, { routePrefix: '/docs' })
  }

  // Plugins
  await app.register(authPlugin)
  await app.register(rateLimitPlugin)

  // Routes
  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(usageRoutes, { prefix: '/me' })
  await app.register(billingRoutes, { prefix: '/billing' })
  await app.register(anonymizeRoutes, { prefix: '/api/v1' })
  await app.register(deanonymizeRoutes, { prefix: '/api/v1' })
  await app.register(keysRoutes, { prefix: '/api/v1' })
  await app.register(contactRoutes, { prefix: '/api/v1' })
  await app.register(adminRoutes, { prefix: '/api/admin' })

  // Health check
  app.get('/health', async () => {
    const [dbStatus, redisStatus] = await Promise.all([
      app.prisma.$queryRaw`SELECT 1`.then(() => 'connected').catch(() => 'error'),
      app.redis
        ? app.redis.ping().then(() => 'connected').catch(() => 'error')
        : 'not configured',
    ])
    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      version: '1.0.0',
      db: dbStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    }
  })

  return app
}
