import type { FastifyInstance } from 'fastify'

export async function auditLogRoutes(app: FastifyInstance) {
  // GET /api/audit-log — list audit events for authenticated business user
  app.get('/api/audit-log', { preHandler: [app.authenticate] }, async (req, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { tier: true, teamId: true },
    })
    if (!user || user.tier !== 'business') {
      return reply.status(403).send({ error: 'Business tier required' })
    }

    const { page = '1', limit = '50' } = req.query as { page?: string; limit?: string }
    const take = Math.min(parseInt(limit, 10) || 50, 200)
    const skip = (parseInt(page, 10) - 1) * take

    const where = user.teamId ? { teamId: user.teamId } : { userId: req.user.userId }

    const [events, total] = await Promise.all([
      app.prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: { user: { select: { email: true, name: true } } },
      }),
      app.prisma.auditEvent.count({ where }),
    ])

    reply.send({ events, total, page: parseInt(page, 10), limit: take })
  })

  // GET /api/audit-log/export — CSV export
  app.get('/api/audit-log/export', { preHandler: [app.authenticate] }, async (req, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { tier: true, teamId: true },
    })
    if (!user || user.tier !== 'business') {
      return reply.status(403).send({ error: 'Business tier required' })
    }

    const where = user.teamId ? { teamId: user.teamId } : { userId: req.user.userId }
    const events = await app.prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } },
    })

    const rows = [
      'timestamp,user_email,action,document_hash,tokens_count',
      ...events.map(e =>
        [
          e.createdAt.toISOString(),
          e.user.email,
          e.action,
          e.documentHash,
          e.tokensCount,
        ].join(',')
      ),
    ].join('\n')

    reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="audit-log.csv"')
      .send(rows)
  })
}
