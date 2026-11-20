import type { HouseAddress } from '../../src/features/geo/metro.ts'

/** Представление анкеты в ответах API — ровно то, что ждёт клиент. */
export type HookerView = {
  id: string
  name: string
  age: number
  city: string
  address: HouseAddress | null
  district: string
  region: string
  phone: string
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

/** Строка выборки анкеты вместе с агрегатами отзывов. */
export type HookerRow = {
  id: string
  name: string
  age: number
  city: string
  address: HouseAddress | null
  district: string
  region: string
  phone: string
  height: number
  price_per_hour: number
  services: string[]
  about: string
  photos: string[]
  main_photo: string
  is_new: boolean
  is_published: boolean
  created_at: Date
  owner_id: string | null
  reviews_count: string | number
  rating: string | number | null
}

/** Колонки с агрегатами: рейтинг и число отзывов считаются по таблице reviews. */
export const HOOKER_COLUMNS = `
  case when a.id is not null then json_build_object('id',a.id,'city',a.city,'street',a.street,
    'house',a.house,'lat',a.lat,'lon',a.lon,'metroIds',a.metro_ids) end as address,
  h.id, h.name, h.age, h.city, h.district, h.region, h.phone, h.height,
  h.price_per_hour, h.services, h.about, h.photos, h.main_photo, h.is_new, h.is_published, h.created_at, h.owner_id,
  coalesce(r.reviews_count, 0) as reviews_count,
  r.rating
`

export const HOOKER_JOIN = `
  left join house_addresses a on a.id = h.address_id
  left join (
    select hooker_id, count(*) as reviews_count, round(avg(rating)::numeric, 1) as rating
    from reviews
    group by hooker_id
  ) r on r.hooker_id = h.id
`

export const toView = (row: HookerRow): HookerView => ({
  address: row.address,
  id: row.id,
  name: row.name,
  age: row.age,
  city: row.city,
  district: row.district,
  region: row.region,
  phone: row.phone,
  height: row.height,
  pricePerHour: row.price_per_hour,
  services: row.services,
  about: row.about,
  rating: row.rating === null ? 0 : Number(row.rating),
  reviewsCount: Number(row.reviews_count),
  photos: row.photos,
  mainPhoto: row.main_photo,
  isNew: row.is_new,
  isPublished: row.is_published,
  createdAt: new Date(row.created_at).toISOString(),
  ownerId: row.owner_id,
})

export type ReviewView = {
  id: string
  authorId: string
  author: string
  rating: number
  text: string
  createdAt: string
}

export type ReviewRow = {
  id: string
  author_id: string
  author: string
  rating: number
  text: string
  created_at: Date
}

export const toReview = (row: ReviewRow): ReviewView => ({
  id: row.id,
  authorId: row.author_id,
  author: row.author,
  rating: row.rating,
  text: row.text,
  createdAt: new Date(row.created_at).toISOString(),
})
