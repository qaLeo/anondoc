import { PrismaClient, Plan } from '@prisma/client'
import { PLAN_LIMITS, TRIAL_DAYS } from '../config/plans.js'

const prisma = new PrismaClient()

function currentPeriod(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Expire trial if needed. Returns the effective plan after check. */
async function resolveEffectivePlan(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  })
  if (!user) return 'FREE'

  const sub = user.subscription
  if (sub?.isTrial && sub.trialEndsAt && sub.trialEndsAt < new Date()) {
    // Trial expired — downgrade to FREE
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { plan: Plan.FREE } }),
      prisma.subscription.update({
        where: { userId },
        data: { plan: Plan.FREE, status: 'canceled', isTrial: false },
      }),
    ])
    return 'FREE'
  }

  return user.plan
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
  const effectivePlan = await resolveEffectivePlan(userId)
  const period = currentPeriod()

  const [usage, user] = await Promise.all([
    prisma.usage.findUnique({ where: { userId_period: { userId, period } } }),
    prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } }),
  ])

  const limit = PLAN_LIMITS[effectivePlan] ?? PLAN_LIMITS.FREE
  const requests = usage?.requests ?? 0

  // Trial info
  const sub = user?.subscription
  const isTrial = sub?.isTrial ?? false
  const trialEndsAt = sub?.trialEndsAt ?? null
  const trialDaysLeft = isTrial && trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86_400_000))
    : null
  const trialUsed = user?.trialUsed ?? false

  return {
    period,
    requests,
    chars: Number(usage?.chars ?? 0),
    plan: effectivePlan,
    limit,
    remaining: limit === -1 ? -1 : Math.max(0, limit - requests),
    isTrial,
    trialEndsAt: trialEndsAt?.toISOString() ?? null,
    trialDaysLeft,
    trialUsed,
    trialDays: TRIAL_DAYS,
  }
}

export async function checkLimit(userId: string): Promise<boolean> {
  const { requests, limit } = await getUsage(userId)
  if (limit === -1) return true
  return requests < limit
}
