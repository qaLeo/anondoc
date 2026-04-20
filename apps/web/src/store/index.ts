import { create } from 'zustand'
import { createAuthSlice, type AuthSlice } from './authSlice'
import { createUsageSlice, type UsageSlice } from './usageSlice'

export type AppStore = AuthSlice & UsageSlice

/**
 * Global Zustand store — slice pattern per CLAUDE.md.
 * Auth and usage state live here; vault/PII mappings are NEVER stored here
 * (they go to encrypted IndexedDB only).
 */
export const useAppStore = create<AppStore>()((...args) => ({
  ...createAuthSlice(...args),
  ...createUsageSlice(...args),
}))
