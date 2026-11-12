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

export const handlers = [
  http.get('*/api/hookers', ({ request }) => {
    const url = new URL(request.url)
    const ids = url.searchParams.get('ids')
    const items = ids ? hookersFixture.filter((item) => ids.split(',').includes(item.id)) : hookersFixture
    return HttpResponse.json({
      items,
      total: items.length,
      page: 1,
      limit: 12,
      hasMore: false,
      cities: ['Москва'],
    })
  }),

  http.get('*/api/hookers/:id/reviews', () => HttpResponse.json({ items: reviewsFixture, total: 1 })),

  http.get('*/api/favorites', () => HttpResponse.json({ ids: [] })),
  http.put('*/api/favorites/:id', () => new HttpResponse(null, { status: 204 })),
  http.delete('*/api/favorites/:id', () => new HttpResponse(null, { status: 204 })),

  http.get('*/api/hookers/:id', ({ params }) => {
    const item = hookersFixture.find((entry) => entry.id === params.id)
    return item
      ? HttpResponse.json(item)
      : new HttpResponse(null, { status: 404 })
  }),
]

export const server = setupServer(...handlers)
