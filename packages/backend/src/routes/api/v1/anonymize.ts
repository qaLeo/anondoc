import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { anonymizeText, normalizeText } from '@anondoc/engine'
import { incrementUsage, checkLimit } from '../../../services/usageService.js'

const AnonymizeBody = z.object({
  text: z.string().min(1).max(500_000),
  options: z.object({
    categories: z.array(z.string()).optional(),
    preserveFormat: z.boolean().default(true),
  }).optional().default({}),
})

export async function anonymizeRoutes(app: FastifyInstance) {
  app.post('/anonymize', {
    preHandler: [app.authenticateApiKey],
    config: { rateLimit: {} }, // uses global plan-based limit
  }, async (req, reply) => {
    const body = AnonymizeBody.parse(req.body)

    const withinLimit = await checkLimit(req.userId)
    if (!withinLimit) {
      return reply.status(429).send({
        error: 'Monthly request limit exceeded. Upgrade your plan.',
      })
    }

    const normalized = normalizeText(body.text)
    const { anonymized, vault, stats } = anonymizeText(normalized)

    await incrementUsage(req.userId, body.text.length)

    const categories = Object.keys(stats)
    const totalMatches = Object.values(stats).reduce((sum, n) => sum + (n ?? 0), 0)

    reply.send({
      original: body.text,
      anonymized,
      vault,
      stats: {
        totalMatches,
        categories,
        byCategory: stats,
        chars: body.text.length,
      },
    })
  })
}
