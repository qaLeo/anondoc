import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH ?? ''

export async function adminRoutes(app: FastifyInstance) {
  // POST /api/admin/login
  app.post('/login', async (req, reply) => {
    const { email, password } = req.body as { email?: string; password?: string }
    if (!email || !password) {
      return reply.status(400).send({ error: 'email and password required' })
    }
    if (email !== ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }
    const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH)
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }
    const token = app.jwt.sign({ role: 'admin', email }, { expiresIn: '8h' })
    reply.send({ token })
  })

  // All routes below require admin JWT
  // GET /api/admin/leads
  app.get('/leads', { preHandler: [app.adminOnly] }, async (req, reply) => {
    const { status, q } = req.query as { status?: string; q?: string }
    const leads = await app.prisma.businessLead.findMany({
      where: {
        ...(status ? { status: status as 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED' } : {}),
        ...(q ? {
          OR: [
            { companyName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { role: { contains: q, mode: 'insensitive' } },
          ],
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })
    reply.send(leads)
  })

  // PATCH /api/admin/leads/:id
  app.patch('/leads/:id', { preHandler: [app.adminOnly] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { status } = req.body as { status?: string }
    if (!status) return reply.status(400).send({ error: 'status required' })
    const lead = await app.prisma.businessLead.update({
      where: { id },
      data: { status: status as 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED' },
    })
    reply.send(lead)
  })

  // GET /api/admin/waitlist
  app.get('/waitlist', { preHandler: [app.adminOnly] }, async (req, reply) => {
    const { q } = req.query as { q?: string }
    const entries = await app.prisma.proWaitlist.findMany({
      where: q ? { email: { contains: q, mode: 'insensitive' } } : {},
      orderBy: { createdAt: 'desc' },
    })
    reply.send(entries)
  })

  // GET /api/admin/waitlist/export — CSV download
  app.get('/waitlist/export', { preHandler: [app.adminOnly] }, async (req, reply) => {
    const entries = await app.prisma.proWaitlist.findMany({
      orderBy: { createdAt: 'desc' },
      select: { email: true, locale: true, createdAt: true },
    })
    const rows = entries.map(e =>
      `${e.email},${e.locale},${e.createdAt.toISOString()}`
    )
    const csv = ['email,locale,createdAt', ...rows].join('\n')
    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename="waitlist.csv"')
      .send(csv)
  })

  // GET /api/admin/stats
  app.get('/stats', { preHandler: [app.adminOnly] }, async (req, reply) => {
    const [leadsTotal, leadsByStatusRaw, waitlistTotal, freeUsersTotal] = await Promise.all([
      app.prisma.businessLead.count(),
      app.prisma.businessLead.groupBy({ by: ['status'], _count: { _all: true } }),
      app.prisma.proWaitlist.count(),
      app.prisma.user.count({ where: { plan: 'FREE' } }),
    ])
    const leadsByStatus = Object.fromEntries(
      leadsByStatusRaw.map(r => [r.status, r._count._all])
    )
    reply.send({ leadsTotal, leadsByStatus, waitlistTotal, freeUsersTotal })
  })

  // DELETE /api/admin/usage/:email — wipe usage rows for an email (testing tool)
  app.delete('/usage/:email', { preHandler: [app.adminOnly] }, async (req, reply) => {
    const { email } = req.params as { email: string }
    const user = await app.prisma.user.findUnique({ where: { email } })
    if (!user) return reply.status(404).send({ error: 'User not found' })
    await app.prisma.usage.deleteMany({ where: { userId: user.id } })
    reply.status(204).send()
  })
}
