import type { PrismaClient } from '@prisma/client'
import type { FastifyBaseLogger } from 'fastify'
import type Redis from 'ioredis'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const LOCK_KEY = 'cron:cleanup'
const LOCK_TTL_SEC = 86400 // 24h — prevents another replica from running the same day

function msUntilNext3amUTC(): number {
  const now = new Date()
  const next = new Date(now)
  next.setUTCHours(3, 0, 0, 0)
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1)
  return next.getTime() - now.getTime()
}

async function runCleanup(
  prisma: PrismaClient,
  logger: FastifyBaseLogger,
  redis: Redis | null,
): Promise<void> {
  // Distributed lock: only one replica runs cleanup per day
  if (redis) {
    const lock = await redis.set(LOCK_KEY, '1', 'NX', 'EX', LOCK_TTL_SEC)
    if (!lock) {
      logger.info('usage-cleanup: skipped (lock held by another instance)')
      return
    }
  }

  const cutoff = new Date(Date.now() - 365 * ONE_DAY_MS)
  const { count } = await prisma.usage.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })
  logger.info({ count }, 'usage-cleanup: deleted records older than 365 days')
}

export function scheduleUsageCleanup(
  prisma: PrismaClient,
  logger: FastifyBaseLogger,
  redis: Redis | null,
): void {
  const delay = msUntilNext3amUTC()
  logger.info({ nextRunMs: delay }, 'usage-cleanup: scheduled')

  setTimeout(() => {
    void runCleanup(prisma, logger, redis)
    setInterval(() => void runCleanup(prisma, logger, redis), ONE_DAY_MS)
  }, delay)
}
