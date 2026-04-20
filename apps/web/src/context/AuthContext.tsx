/**
 * AuthContext — thin adapter over the Zustand app store.
 * All components that call useAuth() continue to work unchanged.
 * AuthProvider initializes auth on mount (restore session via httpOnly cookie).
 */
import { useEffect, type ReactNode } from 'react'
import { useAppStore } from '../store'

export function AuthProvider({ children }: { children: ReactNode }) {
  const initAuth = useAppStore(s => s.initAuth)

  // Restore session on mount — token never touches localStorage
  useEffect(() => { void initAuth() }, [initAuth])

  return <>{children}</>
}

export function useAuth() {
  return useAppStore(s => ({
    user:            s.user,
    isLoading:       s.isAuthLoading,
    isAuthenticated: s.isAuthenticated,
    login:           s.login,
    register:        s.register,
    logout:          s.logout,
  }))
}
