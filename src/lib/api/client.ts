import axios, { AxiosError } from 'axios'
import { env } from '@/lib/env'
import { TOKEN_STORAGE_KEY } from '@/lib/api/token'
import { useSessionStore } from '@/features/auth/store'

export { TOKEN_STORAGE_KEY }

export class ApiError extends Error {
  readonly status: number | undefined
  readonly payload: unknown

  constructor(message: string, status?: number, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export const apiClient = axios.create({
  baseURL: env.apiUrl || '/api',
  timeout: 20_000,
  headers: { Accept: 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    // 401 = токен протух: чистим и хранилище, и стор, иначе UI остаётся «вошедшим».
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      useSessionStore.getState().expire()
    }

    throw new ApiError(
      error.response?.data?.message ?? error.message ?? 'Сеть недоступна',
      error.response?.status,
      error.response?.data,
    )
  },
)
