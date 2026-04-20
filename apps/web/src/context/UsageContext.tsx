/**
 * UsageContext — thin adapter over the Zustand app store.
 * All components that call useUsage() continue to work unchanged.
 * UsageProvider triggers usage refresh when auth state changes.
 */
import { useEffect, type ReactNode } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../store'

export function UsageProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated)
  const refreshUsage    = useAppStore(s => s.refreshUsage)

  // Reload usage after login; clear on logout via store directly
  useEffect(() => {
    if (isAuthenticated) {
      void refreshUsage()
    } else {
      useAppStore.setState({ usage: null, isLimitReached: false, isNearLimit: false, isTrial: false, trialDaysLeft: null })
    }
  }, [isAuthenticated, refreshUsage])

  return <>{children}</>
}

export function useUsage() {
  return useAppStore(useShallow(s => ({
    usage:          s.usage,
    isLoading:      s.isUsageLoading,
    isLimitReached: s.isLimitReached,
    isNearLimit:    s.isNearLimit,
    isTrial:        s.isTrial,
    trialDaysLeft:  s.trialDaysLeft,
    refresh:        s.refreshUsage,
    trackDocument:  s.trackDocument,
  })))
}
