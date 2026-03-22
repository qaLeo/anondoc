import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authApi, type UserProfile } from '../api/client'

interface AuthState {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount — restore session from localStorage token
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setIsLoading(false)
      return
    }
    authApi.profile()
      .then(({ data }) => setUser(data))
      .catch(() => localStorage.removeItem('accessToken'))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password)
    localStorage.setItem('accessToken', data.accessToken)
    setUser(data.user)
  }, [])

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const { data } = await authApi.register(email, password, name)
    localStorage.setItem('accessToken', data.accessToken)
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore — clear local state regardless
    }
    localStorage.removeItem('accessToken')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
