export const PLAN_LIMITS: Record<string, number> = {
  FREE: 10,
  PRO: -1,        // unlimited
  BUSINESS: -1,   // unlimited (TEAM in UI)
  ENTERPRISE: -1, // unlimited
}

export const TRIAL_DAYS = 14
export const TRIAL_PLAN = 'PRO' as const
