import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { Hooker, Review } from '@/features/hookers/types'

function make(partial: Partial<Hooker> & { id: string; name: string }): Hooker {
  return {
    age: 24,
    city: 'Москва',
    region: 'Москва и область',
    phone: '+7 915 100-10-00',
    district: 'Пресня',
    height: 170,
    pricePerHour: 5000,
    services: ['Классика'],
    about: 'Описание',
    rating: 4.5,
    reviewsCount: 1,
    photos: [],
    isNew: false,
    createdAt: '2026-01-01T00:00:00Z',
    ownerId: null,
    ...partial,
  }
}

export const hookersFixture: Hooker[] = [
  make({ id: '1', name: 'Первый контакт' }),
  make({ id: '2', name: 'Сделка на 3000', pricePerHour: 3000 }),
]

/** Вторая страница выдачи — для проверки «Показать ещё». */
export const extraFixture: Hooker[] = Array.from({ length: 12 }, (_, index) =>
  make({ id: `page-${index + 1}`, name: `Анкета ${index + 1}`, pricePerHour: 4000 + index * 100 }),
)

export const reviewsFixture: Review[] = [
  {
    id: 'r1',
    authorId: 'u1',
    author: 'Дмитрий',
    rating: 5,
    text: 'Всё по анкете, приехала вовремя.',
    createdAt: '2026-10-01T10:00:00Z',
  },
]

/** Избранное живёт в модульной переменной: PUT/DELETE меняют то же, что читает GET. */
let favoriteIds: string[] = []

export function setFavoriteIds(ids: string[]) {
  favoriteIds = [...ids]
}

export function resetFixtures() {
  favoriteIds = []
}

export const handlers = [
  http.get('*/api/hookers', ({ request }) => {
    const url = new URL(request.url)
    const ids = url.searchParams.get('ids')
    const hasPhoto = url.searchParams.get('hasPhoto')
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Number(url.searchParams.get('limit') ?? 12)

    let items = [...hookersFixture, ...extraFixture]
    if (ids) items = items.filter((item) => ids.split(',').includes(item.id))
    if (hasPhoto) items = items.filter((item) => item.photos.length > 0)
    if (url.searchParams.get('minPrice')) {
      items = items.filter((item) => item.pricePerHour >= Number(url.searchParams.get('minPrice')))
    }

    const total = items.length
    const start = (page - 1) * limit
    return HttpResponse.json({
      items: items.slice(start, start + limit),
      total,
      page,
      limit,
      hasMore: start + limit < total,
      cities: ['Москва'],
    })
  }),

  http.get('*/api/stats/districts', () =>
    HttpResponse.json({ items: [{ district: 'Пресня', count: 2 }], total: 2 }),
  ),

  http.get('*/api/hookers/:id/reviews', () => HttpResponse.json({ items: reviewsFixture, total: 1 })),

  http.get('*/api/stats/districts', () =>
    HttpResponse.json({ items: [{ district: 'Пресня', city: 'Москва', count: 1 }], total: 1 }),
  ),

  http.get('*/api/favorites', () => HttpResponse.json({ ids: favoriteIds, total: favoriteIds.length })),
  http.put('*/api/favorites/:id', ({ params }) => {
    favoriteIds = [...favoriteIds.filter((id) => id !== params.id), String(params.id)]
    return new HttpResponse(null, { status: 204 })
  }),
  http.delete('*/api/favorites/:id', ({ params }) => {
    favoriteIds = favoriteIds.filter((id) => id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('*/api/hookers/:id', ({ params }) => {
    const item = [...hookersFixture, ...extraFixture].find((entry) => entry.id === params.id)
    return item
      ? HttpResponse.json(item)
      : new HttpResponse(null, { status: 404 })
  }),
]

export const server = setupServer(...handlers)
