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

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport: process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty' }
        : undefined,
    },
  })

  // Security
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  })
  await app.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
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

  // Health check
  app.get('/health', async () => ({ status: 'ok', ts: Date.now() }))

  return app
}
