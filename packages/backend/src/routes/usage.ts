import type { FastifyInstance } from 'fastify'
import { getUsage } from '../services/usageService.js'

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
}
