import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PLAN_MONTHLY_LIMITS: Record<string, number> = {
  FREE: 50,
  PRO: 5000,
  BUSINESS: 50000,
  ENTERPRISE: -1, // unlimited
}

function currentPeriod(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export async function incrementUsage(userId: string, chars: number): Promise<void> {
  const period = currentPeriod()
  await prisma.usage.upsert({
    where: { userId_period: { userId, period } },
    create: { userId, period, requests: 1, chars: BigInt(chars) },
    update: {
      requests: { increment: 1 },
      chars: { increment: BigInt(chars) },
    },
  })
}

export async function getUsage(userId: string) {
  const period = currentPeriod()
  const usage = await prisma.usage.findUnique({
    where: { userId_period: { userId, period } },
  })
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const limit = PLAN_MONTHLY_LIMITS[user?.plan ?? 'FREE']

  return {
    period,
    requests: usage?.requests ?? 0,
    chars: Number(usage?.chars ?? 0),
    plan: user?.plan ?? 'FREE',
    limit,
    remaining: limit === -1 ? -1 : Math.max(0, limit - (usage?.requests ?? 0)),
  }
}

export async function checkLimit(userId: string): Promise<boolean> {
  const { requests, limit } = await getUsage(userId)
  if (limit === -1) return true
  return requests < limit
}
