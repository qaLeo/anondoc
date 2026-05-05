import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { createHash } from 'crypto'

/**
 * Write an AuditEvent for Business-tier users.
 * Call this after a successful anonymize/decrypt operation.
 */
export async function writeAuditEvent(
  app: FastifyInstance,
  params: {
    userId: string
    teamId: string | null
    action: 'anonymize' | 'decrypt'
    documentContent: string
    tokensCount: number
  }
) {
  const { userId, teamId, action, documentContent, tokensCount } = params
  const documentHash = createHash('sha256').update(documentContent).digest('hex').slice(0, 16)
  await app.prisma.auditEvent.create({
    data: {
      userId,
      teamId: teamId ?? undefined,
      action,
      documentHash,
      tokensCount,
    },
  }).catch(() => {/* non-critical — don't break the main flow */})
}

export function auditLoggerHook(action: 'anonymize' | 'decrypt') {
  return async (req: FastifyRequest, _reply: FastifyReply) => {
    const userId = (req.user as { userId?: string })?.userId
    if (!userId) return

    const user = await (req.server as FastifyInstance).prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true, teamId: true },
    }).catch(() => null)

    if (!user || user.tier !== 'business') return

    ;(req as FastifyRequest & { _auditUserId?: string; _auditTeamId?: string | null; _auditAction?: string })._auditUserId = userId
    ;(req as FastifyRequest & { _auditUserId?: string; _auditTeamId?: string | null; _auditAction?: string })._auditTeamId = user.teamId
    ;(req as FastifyRequest & { _auditUserId?: string; _auditTeamId?: string | null; _auditAction?: string })._auditAction = action
  }
}
