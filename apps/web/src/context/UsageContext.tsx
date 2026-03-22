import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { usageApi, type UsageData } from '../api/client'
import { useAuth } from './AuthContext'

interface UsageState {
  usage: UsageData | null
  isLoading: boolean
  isLimitReached: boolean
  isNearLimit: boolean       // > 80%
  isTrial: boolean
  trialDaysLeft: number | null
  refresh: () => Promise<void>
  trackDocument: () => Promise<void>
}

const UsageContext = createContext<UsageState | null>(null)

export function UsageProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const { data } = await usageApi.get()
      setUsage(data)
    } catch {
      // silently ignore — usage is non-critical
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Load usage after login; clear on logout
  useEffect(() => {
    if (isAuthenticated) {
      refresh()
    } else {
      setUsage(null)
    }
  }, [isAuthenticated, refresh])

  const trackDocument = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      await usageApi.track()
      await refresh()
    } catch {
      // non-critical
    }
  }, [isAuthenticated, refresh])

  const limit = usage?.limit ?? 0
  const requests = usage?.requests ?? 0

  const isLimitReached = limit !== -1 && limit > 0 && requests >= limit
  const isNearLimit = limit !== -1 && limit > 0 && requests / limit > 0.8
  const isTrial = usage?.isTrial ?? false
  const trialDaysLeft = usage?.trialDaysLeft ?? null

  return (
    <UsageContext.Provider value={{
      usage,
      isLoading,
      isLimitReached,
      isNearLimit,
      isTrial,
      trialDaysLeft,
      refresh,
      trackDocument,
    }}>
      {children}
    </UsageContext.Provider>
  )
}

export function useUsage() {
  const ctx = useContext(UsageContext)
  if (!ctx) throw new Error('useUsage must be used inside UsageProvider')
  return ctx
}
