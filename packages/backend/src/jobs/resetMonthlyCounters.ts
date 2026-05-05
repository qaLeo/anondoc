/**
 * Cron job: reset documentsUsedThisMonth for all Free users.
 * Schedule: 0 0 1 * * (1st of every month at midnight UTC)
 * Railway: add as a cron service pointing to this file's exported handler.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function resetMonthlyCounters() {
  const result = await prisma.user.updateMany({
    where: { tier: 'free' },
    data: {
      documentsUsedThisMonth: 0,
      documentsResetAt: new Date(),
    },
  })
  console.log(`[resetMonthlyCounters] Reset ${result.count} Free users`)
  return result
}

// Entry point when run directly (e.g. via Railway cron)
if (process.argv[1]?.endsWith('resetMonthlyCounters.js') || process.argv[1]?.endsWith('resetMonthlyCounters.ts')) {
  resetMonthlyCounters()
    .then(() => prisma.$disconnect())
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err)
      prisma.$disconnect()
      process.exit(1)
    })
}
