import type { StateCreator } from 'zustand'
import { authApi, setAccessToken, type UserProfile } from '../api/client'
import type { AppStore } from '.'

// Lightweight hint stored in localStorage so we can skip the refresh call
// for visitors who never logged in. The actual refresh token is httpOnly and
// cannot be read from JS — this flag is just a proxy.
const SESSION_HINT_KEY = 'anondoc:session'

// In-flight guard — prevents parallel initAuth calls (e.g. online-event race)
let initAuthPromise: Promise<void> | null = null

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

  initAuth: () => {
    // Return the in-flight promise if already running
    if (initAuthPromise) return initAuthPromise

    initAuthPromise = (async () => {
      // Skip entirely if offline
      if (!navigator.onLine) {
        console.debug('[auth] skipped refresh: offline')
        set({ user: null, isAuthenticated: false, isAuthLoading: false })
        return
      }

      // Skip if no previous session — avoids 401 spam for new visitors
      if (!localStorage.getItem(SESSION_HINT_KEY)) {
        console.debug('[auth] skipped refresh: no prior session')
        set({ user: null, isAuthenticated: false, isAuthLoading: false })
        return
      }

      try {
        const { data: refreshData } = await authApi.refresh()
        setAccessToken(refreshData.accessToken)
        const { data: profile } = await authApi.profile()
        set({ user: profile, isAuthenticated: true })
      } catch {
        // Refresh failed — clear the stale hint so we don't retry on next page load
        localStorage.removeItem(SESSION_HINT_KEY)
        setAccessToken(null)
        set({ user: null, isAuthenticated: false })
      } finally {
        set({ isAuthLoading: false })
        initAuthPromise = null
      }
    })()

    return initAuthPromise
  },

  login: async (email, password) => {
    const { data } = await authApi.login(email, password)
    setAccessToken(data.accessToken)
    localStorage.setItem(SESSION_HINT_KEY, '1')
    set({ user: data.user, isAuthenticated: true })
  },

  register: async (email, password, name) => {
    const { data } = await authApi.register(email, password, name)
    setAccessToken(data.accessToken)
    localStorage.setItem(SESSION_HINT_KEY, '1')
    set({ user: data.user, isAuthenticated: true })
  },

  logout: async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    localStorage.removeItem(SESSION_HINT_KEY)
    setAccessToken(null)
    set({ user: null, isAuthenticated: false })
  },
})
