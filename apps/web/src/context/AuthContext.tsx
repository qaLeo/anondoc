/**
 * AuthContext — thin adapter over the Zustand app store.
 * All components that call useAuth() continue to work unchanged.
 * AuthProvider initializes auth on mount (restore session via httpOnly cookie).
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../store'

export function AuthProvider({ children }: { children: ReactNode }) {
  const initAuth = useAppStore(s => s.initAuth)
  const attempted = useRef(false)

  // Restore session on mount — token never touches localStorage.
  // Guard prevents double-call in StrictMode / concurrent mode.
  useEffect(() => {
    if (attempted.current) return
    attempted.current = true
    void initAuth()
  }, [initAuth])

  return <>{children}</>
}

export function useAuth() {
  return useAppStore(useShallow(s => ({
    user:            s.user,
    isLoading:       s.isAuthLoading,
    isAuthenticated: s.isAuthenticated,
    login:           s.login,
    register:        s.register,
    logout:          s.logout,
  })))
}
