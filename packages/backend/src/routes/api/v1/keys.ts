import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomBytes, createHash } from 'crypto'

const CreateKeyBody = z.object({
  name: z.string().min(1).max(64),
  scopes: z.array(z.string()).default(['anonymize']),
  expiresAt: z.string().datetime().optional(),
})

function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `ak_${randomBytes(32).toString('hex')}`
  const hash = createHash('sha256').update(raw).digest('hex')
  const prefix = raw.slice(0, 10)
  return { raw, hash, prefix }
}

export async function keysRoutes(app: FastifyInstance) {
  // GET /api/v1/keys
  app.get('/keys', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const keys = await app.prisma.apiKey.findMany({
      where: { userId: req.userId, revokedAt: null },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    reply.send(keys)
  })

  // POST /api/v1/keys
  app.post('/keys', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const body = CreateKeyBody.parse(req.body)
    const { raw, hash, prefix } = generateApiKey()

    const key = await app.prisma.apiKey.create({
      data: {
        userId: req.userId,
        name: body.name,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: body.scopes,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      },
    })

    // Return the raw key ONCE — never stored again
    reply.status(201).send({
      id: key.id,
      name: key.name,
      key: raw,        // shown only at creation
      keyPrefix: prefix,
      scopes: key.scopes,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    })
  })

  // DELETE /api/v1/keys/:id
  app.delete('/keys/:id', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const key = await app.prisma.apiKey.findFirst({
      where: { id, userId: req.userId },
    })
    if (!key) return reply.status(404).send({ error: 'API key not found' })

    await app.prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    })
    reply.send({ ok: true })
  })
}
