import type { PrismaClient } from '@prisma/client'
import type { FastifyBaseLogger } from 'fastify'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function msUntilNext3amUTC(): number {
  const now = new Date()
  const next = new Date(now)
  next.setUTCHours(3, 0, 0, 0)
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1)
  return next.getTime() - now.getTime()
}

async function runCleanup(prisma: PrismaClient, logger: FastifyBaseLogger): Promise<void> {
  const cutoff = new Date(Date.now() - 365 * ONE_DAY_MS)
  const { count } = await prisma.usage.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })
  logger.info({ count }, 'usage-cleanup: deleted records older than 365 days')
}

export function scheduleUsageCleanup(prisma: PrismaClient, logger: FastifyBaseLogger): void {
  const delay = msUntilNext3amUTC()
  logger.info({ nextRunMs: delay }, 'usage-cleanup: scheduled')

  setTimeout(() => {
    void runCleanup(prisma, logger)
    setInterval(() => void runCleanup(prisma, logger), ONE_DAY_MS)
  }, delay)
}
