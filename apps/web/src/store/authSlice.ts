import type { StateCreator } from 'zustand'
import { authApi, setAccessToken, type UserProfile } from '../api/client'
import type { AppStore } from '.'

export interface AuthSlice {
  user: UserProfile | null
  isAuthLoading: boolean
  isAuthenticated: boolean
  initAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
}

export const createAuthSlice: StateCreator<AppStore, [], [], AuthSlice> = (set) => ({
  user: null,
  isAuthLoading: true,
  isAuthenticated: false,

  initAuth: async () => {
    try {
      const { data: refreshData } = await authApi.refresh()
      setAccessToken(refreshData.accessToken)
      const { data: profile } = await authApi.profile()
      set({ user: profile, isAuthenticated: true })
    } catch {
      setAccessToken(null)
      set({ user: null, isAuthenticated: false })
    } finally {
      set({ isAuthLoading: false })
    }
  },

  login: async (email, password) => {
    const { data } = await authApi.login(email, password)
    setAccessToken(data.accessToken)
    set({ user: data.user, isAuthenticated: true })
  },

  register: async (email, password, name) => {
    const { data } = await authApi.register(email, password, name)
    setAccessToken(data.accessToken)
    set({ user: data.user, isAuthenticated: true })
  },

  logout: async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    setAccessToken(null)
    set({ user: null, isAuthenticated: false })
  },
})
