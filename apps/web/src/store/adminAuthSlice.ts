import { create } from 'zustand'

const ADMIN_TOKEN_KEY = 'adminToken'
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface AdminAuthState {
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAdminStore = create<AdminAuthState>((set) => ({
  token: localStorage.getItem(ADMIN_TOKEN_KEY),
  isAuthenticated: !!localStorage.getItem(ADMIN_TOKEN_KEY),

  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Login failed')
    }
    const { token } = await res.json()
    localStorage.setItem(ADMIN_TOKEN_KEY, token)
    set({ token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    set({ token: null, isAuthenticated: false })
  },
}))

/** Fetch helper that injects the admin Bearer token */
export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })
}
