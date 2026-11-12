import axios, { AxiosError } from 'axios'
import { env } from '@/lib/env'

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

export const TOKEN_STORAGE_KEY = 'hp3k-token'

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
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }

    throw new ApiError(
      error.response?.data?.message ?? error.message ?? 'Сеть недоступна',
      error.response?.status,
      error.response?.data,
    )
  },
)
