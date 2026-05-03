import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    authenticateApiKey: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    adminOnly: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    userId: string
    userPlan: string
    userEmail: string
  }
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  app.decorate('prisma', prisma)

  // Graceful shutdown
  app.addHook('onClose', async () => {
    await prisma.$disconnect()
  })

  // JWT auth
  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify()
      const payload = req.user as { sub: string; email: string; plan: string }
      req.userId = payload.sub
      req.userEmail = payload.email ?? ''
      req.userPlan = payload.plan
    } catch {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  // Admin-only JWT auth — requires role: 'admin' in token
  app.decorate('adminOnly', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify()
      const payload = req.user as { role?: string }
      if (payload.role !== 'admin') {
        return reply.status(403).send({ error: 'Forbidden' })
      }
    } catch {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  // API Key auth
  app.decorate('authenticateApiKey', async (req: FastifyRequest, reply: FastifyReply) => {
    const raw = req.headers['x-api-key'] as string | undefined
    if (!raw) {
      reply.status(401).send({ error: 'Missing X-API-Key header' })
      return
    }

    const keyHash = createHash('sha256').update(raw).digest('hex')
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    })

    if (!apiKey || apiKey.revokedAt) {
      reply.status(401).send({ error: 'Invalid or revoked API key' })
      return
    }
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      reply.status(401).send({ error: 'API key expired' })
      return
    }

    // Update last used (fire and forget)
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {})

    req.userId = apiKey.userId
    req.userPlan = apiKey.user.plan
  })
})
