import { apiClient } from '@/lib/api/client'
import type { Hooker, HookerListParams, HookerListResponse, Review } from './types'

export function toQuery(params: HookerListParams): string {
  const search = new URLSearchParams()
  if (params.metro) search.set('metro', params.metro)
  if (params.q) search.set('q', params.q)
  if (params.city) search.set('city', params.city)
  if (params.district) search.set('district', params.district)
  if (params.service) search.set('service', params.service)
  if (params.minPrice) search.set('minPrice', String(params.minPrice))
  if (params.maxPrice) search.set('maxPrice', String(params.maxPrice))
  if (params.sort) search.set('sort', params.sort)
  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))
  if (params.ids?.length) search.set('ids', params.ids.join(','))
  if (params.hasPhoto) search.set('hasPhoto', '1')
  if (params.reviewed) search.set('reviewed', '1')
  if (params.center) search.set('center', '1')
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function fetchHookers(
  params: HookerListParams = {},
  signal?: AbortSignal,
): Promise<HookerListResponse> {
  const { data } = await apiClient.get<HookerListResponse>(`/hookers${toQuery(params)}`, { signal })
  return data
}

export async function fetchHooker(id: string, signal?: AbortSignal): Promise<Hooker> {
  const { data } = await apiClient.get<Hooker>(`/hookers/${id}`, { signal })
  return data
}

export async function fetchMyHookers(signal?: AbortSignal): Promise<Hooker[]> {
  const { data } = await apiClient.get<{ items: Hooker[] }>('/me/hookers', { signal })
  return data.items
}

export type ListingPayload = {
  showHouse?: boolean
  telegram?: string
  addressId?: string
  name: string
  age: number
  city: string
  district?: string
  region: string
  phone: string
  height: number
  pricePerHour: number
  /** Выбранные услуги из справочника SERVICES. */
  services?: string[]
  photos?: string[]
  mainPhoto?: string
  about?: string
  paymentMethod?: string
}

export function toListingBody(input: ListingPayload) {
  return {
    addressId: input.addressId,
    showHouse: input.showHouse,
    telegram: input.telegram,
    name: input.name,
    age: Number(input.age),
    city: input.city,
    district: input.district,
    region: input.region,
    phone: input.phone,
    height: Number(input.height),
    pricePerHour: Number(input.pricePerHour),
    services: input.services ?? [],
    photos: input.photos ?? [],
    mainPhoto: input.mainPhoto ?? '',
    about: input.about ?? '',
  }
}

/** Загружает одно фото и отдаёт его URL. */
export async function uploadPhoto(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiClient.post<{ url: string }>('/uploads', form)
  return data.url
}

export async function createHooker(input: ListingPayload): Promise<Hooker> {
  const { data } = await apiClient.post<Hooker>('/hookers', toListingBody(input))
  return data
}

export async function updateHooker(id: string, input: ListingPayload): Promise<Hooker> {
  const { data } = await apiClient.patch<Hooker>(`/hookers/${id}`, toListingBody(input))
  return data
}

export async function deleteHooker(id: string): Promise<void> {
  await apiClient.delete(`/hookers/${id}`)
}

export type ReviewSort = 'new' | 'old' | 'best' | 'worst'
export async function fetchReviews(
  id: string,
  sort: ReviewSort = 'new',
  signal?: AbortSignal,
): Promise<Review[]> {
  const { data } = await apiClient.get<{ items: Review[] }>(
    `/hookers/${id}/reviews?sort=${sort}`,
    { signal },
  )
  return data.items
}

export async function createReview(
  id: string,
  input: { rating: number; text: string },
): Promise<Review> {
  const { data } = await apiClient.post<Review>(`/hookers/${id}/reviews`, input)
  return data
}

export type DistrictStat = { district: string; city: string; count: number }

/** Плотность анкет по районам для тепловой карты. */
export async function fetchDistrictStats(signal?: AbortSignal): Promise<DistrictStat[]> {
  const { data } = await apiClient.get<{ items: DistrictStat[] }>('/stats/districts', { signal })
  return data.items
}
