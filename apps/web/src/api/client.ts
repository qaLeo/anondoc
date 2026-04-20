import axios from 'axios'

// In dev, Vite proxies /auth /me /billing /api → localhost:3000 (no CORS needed).
// In production set VITE_API_URL to your backend origin.
const BASE_URL = import.meta.env.VITE_API_URL ?? ''
console.log('API URL:', BASE_URL || '(empty — using Vite proxy)')

// Access token lives in memory only — never touches localStorage
let _accessToken: string | null = null

export function setAccessToken(token: string | null) {
  _accessToken = token
}

export function getAccessToken(): string | null {
  return _accessToken
}

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send refresh token cookie
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

// Handle 401 — refresh token then retry
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const url: string = original?.url ?? ''

    // Never retry refresh requests — avoids infinite loop
    if (url.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      if (isRefreshing) {
        // Queue requests while refresh is in flight
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      isRefreshing = true
      try {
        const { data } = await api.post<{ accessToken: string }>('/auth/refresh', {})
        const newToken = data.accessToken
        setAccessToken(newToken)
        refreshQueue.forEach((cb) => cb(newToken))
        refreshQueue = []
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        setAccessToken(null)
        refreshQueue = []
        window.location.href = '/auth'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    // Human-readable error messages
    const msg: string =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'Неизвестная ошибка'

    return Promise.reject(new Error(msg))
  },
)

// Auth endpoints
export const authApi = {
  register: (email: string, password: string, name?: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, name }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  refresh: () => api.post<{ accessToken: string }>('/auth/refresh'),

  profile: () => api.get<UserProfile>('/me/profile'),
}

// Usage endpoints
export const usageApi = {
  get: () => api.get<UsageData>('/me/usage'),
  track: () => api.post('/me/usage/track'),
}

// Billing endpoints
export const billingApi = {
  subscribe: (plan: string, returnUrl: string) =>
    api.post<{ url: string }>('/billing/subscribe', { plan, returnUrl }),
  startTrial: () => api.post<{ ok: boolean }>('/billing/trial'),
  cancel: () => api.post('/billing/cancel'),
  subscription: () => api.get<SubscriptionData>('/billing/subscription'),
}

// API Keys endpoints
export const keysApi = {
  list: () => api.get<ApiKey[]>('/api/v1/keys'),
  create: (name: string) => api.post<ApiKeyCreated>('/api/v1/keys', { name }),
  revoke: (id: string) => api.delete(`/api/v1/keys/${id}`),
}

// Types
export interface AuthResponse {
  accessToken: string
  user: UserProfile
}

export interface UserProfile {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  plan: 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE'
}

export interface UsageData {
  period: string
  requests: number
  chars: number
  plan: string
  limit: number       // -1 = unlimited
  remaining: number
  isTrial: boolean
  trialEndsAt: string | null
  trialDaysLeft: number | null
  trialUsed: boolean
  trialDays: number
}

export interface SubscriptionData {
  plan: string
  status: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
}

export interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  scopes: string[]
  lastUsedAt?: string
  expiresAt?: string
  createdAt: string
}

export interface ApiKeyCreated extends ApiKey {
  key: string  // raw key, shown once
}
