import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send refresh token cookie
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
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
        const { data } = await axios.post<{ accessToken: string }>(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        const newToken = data.accessToken
        localStorage.setItem('accessToken', newToken)
        refreshQueue.forEach((cb) => cb(newToken))
        refreshQueue = []
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        localStorage.removeItem('accessToken')
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
  limit: number   // -1 = unlimited
  remaining: number
}
