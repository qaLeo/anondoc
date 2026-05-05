/**
 * Cron job: delete history entries older than 30 days for Free users.
 * Schedule: 0 3 * * * (daily at 03:00 UTC)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const HISTORY_RETENTION_DAYS = 30

export async function cleanupHistory() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - HISTORY_RETENTION_DAYS)

  // Get Free user IDs
  const freeUsers = await prisma.user.findMany({
    where: { tier: 'free' },
    select: { id: true },
  })
  const freeUserIds = freeUsers.map(u => u.id)

  if (freeUserIds.length === 0) {
    console.log('[cleanupHistory] No Free users found')
    return
  }

  // Delete Usage records older than cutoff for Free users
  // (Usage tracks document counts per period — purge old periods)
  const deleted = await prisma.usage.deleteMany({
    where: {
      userId: { in: freeUserIds },
      createdAt: { lt: cutoff },
    },
  })

  console.log(`[cleanupHistory] Deleted ${deleted.count} old usage records for Free users`)
  return deleted
}

if (process.argv[1]?.endsWith('cleanupHistory.js') || process.argv[1]?.endsWith('cleanupHistory.ts')) {
  cleanupHistory()
    .then(() => prisma.$disconnect())
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err)
      prisma.$disconnect()
      process.exit(1)
    })
}
