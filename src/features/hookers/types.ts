export type HookerKind = 'project' | 'deal' | 'other'

export type Hooker = {
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
  q?: string
  city?: string
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
  total: number
  page: number
  limit: number
  hasMore: boolean
  cities: string[]
}
