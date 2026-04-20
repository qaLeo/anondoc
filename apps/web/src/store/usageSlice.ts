import type { StateCreator } from 'zustand'
import { usageApi, type UsageData } from '../api/client'
import type { AppStore } from '.'

export interface UsageSlice {
  usage: UsageData | null
  isUsageLoading: boolean
  isLimitReached: boolean
  isNearLimit: boolean
  isTrial: boolean
  trialDaysLeft: number | null
  refreshUsage: () => Promise<void>
  trackDocument: () => Promise<void>
}

export const createUsageSlice: StateCreator<AppStore, [], [], UsageSlice> = (set, get) => ({
  usage: null,
  isUsageLoading: false,
  isLimitReached: false,
  isNearLimit: false,
  isTrial: false,
  trialDaysLeft: null,

  refreshUsage: async () => {
    if (!get().isAuthenticated) return
    set({ isUsageLoading: true })
    try {
      const { data } = await usageApi.get()
      const { limit, requests } = data
      set({
        usage: data,
        isLimitReached: limit !== -1 && limit > 0 && requests >= limit,
        isNearLimit:    limit !== -1 && limit > 0 && requests / limit > 0.8,
        isTrial:        data.isTrial,
        trialDaysLeft:  data.trialDaysLeft,
      })
    } catch {
      // non-critical — silently ignore
    } finally {
      set({ isUsageLoading: false })
    }
  },

  trackDocument: async () => {
    if (!get().isAuthenticated) return
    try {
      await usageApi.track()
      await get().refreshUsage()
    } catch {
      // non-critical
    }
  },
})
