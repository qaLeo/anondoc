import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const demoRequestSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  company: z.string().min(1).max(100),
  teamSize: z.enum(['1-5', '6-10', '11-25', '26-100', '100+']),
  industry: z.enum(['HR', 'Recht', 'Pharma', 'Finanzen', 'Sonstiges']),
  message: z.string().max(500).optional(),
  privacyAccepted: z.literal(true),
})

const CALENDLY_URL = process.env.CALENDLY_URL ?? 'https://calendly.com/anondoc/demo'
const SLACK_WEBHOOK = process.env.SLACK_SALES_WEBHOOK_URL ?? ''

async function notifySlack(data: {
  name: string
  email: string
  company: string
  teamSize: string
  industry: string
  message?: string
}) {
  if (!SLACK_WEBHOOK) return
  const text = [
    `*Neue Demo-Anfrage*`,
    `Name: ${data.name}`,
    `E-Mail: ${data.email}`,
    `Unternehmen: ${data.company}`,
    `Teamgröße: ${data.teamSize}`,
    `Branche: ${data.industry}`,
    data.message ? `Nachricht: ${data.message}` : null,
  ]
    .filter(Boolean)
    .join('\n')
  await fetch(SLACK_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }).catch(() => {/* non-critical */})
}

export async function demoRequestRoutes(app: FastifyInstance) {
  app.post('/api/demo-requests', async (req, reply) => {
    const parsed = demoRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() })
    }

    const { name, email, company, teamSize, industry, message } = parsed.data

    const record = await app.prisma.demoRequest.create({
      data: { name, email, company, teamSize, industry, message },
    })

    // Notify Slack asynchronously — don't block the response
    notifySlack({ name, email, company, teamSize, industry, message }).catch(() => {})

    const firstName = name.split(' ')[0]
    const calendlyUrl = `${CALENDLY_URL}?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`

    reply.send({
      id: record.id,
      calendlyUrl,
      firstName,
    })
  })
}
