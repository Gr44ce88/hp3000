export type HookerKind = 'project' | 'deal' | 'other'

import type { HouseAddress } from '@/features/geo/metro'
export type Hooker = {
  telegram?: string
  showHouse?: boolean
  confirmedAt?: string | null
  paused?: boolean
  distanceBand?:string
  metroIds?: string[]
  address?: HouseAddress | null
  id: string
  name: string
  age: number
  city: string
  region: string
  phone: string
  district: string
  height: number
  pricePerHour: number
  services: string[]
  about: string
  rating: number
  reviewsCount: number
  photos: string[]
  mainPhoto: string
  isNew: boolean
  isPublished: boolean
  createdAt: string
  ownerId: string | null
}

export type Review = {
  id: string
  authorId: string
  author: string
  rating: number
  text: string
  createdAt: string
}

export type HookerListParams = {
  metro?: string
  q?: string
  city?: string
  district?: string
  service?: string
  minPrice?: number
  maxPrice?: number
  sort?: string
  page?: number
  limit?: number
  ids?: string[]
  /** только с фото */
  hasPhoto?: boolean
  /** только с отзывами */
  reviewed?: boolean
  /** только центральные районы */
  center?: boolean
}

export type HookerListResponse = {
  items: Hooker[]
  mappedTotal?: number
  total: number
  page: number
  limit: number
  hasMore: boolean
  cities: string[]
}
