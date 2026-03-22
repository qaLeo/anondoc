import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { deanonymizeText } from '@anondoc/engine'

const DeanonymizeBody = z.object({
  text: z.string().min(1).max(500_000),
  vault: z.record(z.string()),
})

export async function deanonymizeRoutes(app: FastifyInstance) {
  app.post('/deanonymize', {
    preHandler: [app.authenticateApiKey],
    config: { rateLimit: {} },
  }, async (req, reply) => {
    const body = DeanonymizeBody.parse(req.body)
    const restored = deanonymizeText(body.text, body.vault)
    reply.send({ restored })
  })
}
