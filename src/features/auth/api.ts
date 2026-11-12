import { apiClient } from '@/lib/api/client'

export type SessionUser = { id: string; email: string; name: string; phone: string; avatarUrl: string }

type AuthResponse = { token: string; user: SessionUser }

export async function login(input: { email: string; password: string }): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', input)
  return data
}

export async function register(input: {
  name: string
  email: string
  password: string
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', input)
  return data
}

export async function fetchMe(): Promise<SessionUser> {
  const { data } = await apiClient.get<{ user: SessionUser }>('/me')
  return data.user
}

export async function updateMe(input: { name: string; email: string }): Promise<SessionUser> {
  const { data } = await apiClient.patch<{ user: SessionUser }>('/me', input)
  return data.user
}

export type ViewedListing = {
  id: string
  name: string
  age: number
  city: string
  pricePerHour: number
  viewedAt: string
}

export async function fetchHistory(signal?: AbortSignal): Promise<ViewedListing[]> {
  const { data } = await apiClient.get<{ items: ViewedListing[] }>('/me/history', { signal })
  return data.items
}

export type MyReview = {
  id: string
  hookerId: string
  hookerName: string
  rating: number
  text: string
  createdAt: string
}

export async function fetchMyReviews(signal?: AbortSignal): Promise<MyReview[]> {
  const { data } = await apiClient.get<{ items: MyReview[] }>('/me/reviews', { signal })
  return data.items
}
