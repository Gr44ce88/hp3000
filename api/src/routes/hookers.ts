import { Router } from 'express'
import { attachUser, currentUser, requireAuth } from '../auth/middleware.ts'
import { one, query } from '../db/pool.ts'
import { conflict, forbidden, notFound } from '../http/errors.ts'
import { handle, parseBody } from '../http/respond.ts'
import { listQuerySchema, listingSchema, reviewSchema, reviewSortSchema } from '../schemas.ts'
import {
  HOOKER_COLUMNS,
  HOOKER_JOIN,
  toReview,
  toView,
  type HookerRow,
  type ReviewRow,
} from '../views.ts'
import { config } from '../config.ts'

export const hookersRouter: Router = Router()

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const SORTS: Record<string, string> = {
  'price-asc': 'h.price_per_hour asc, h.created_at desc',
  'price-desc': 'h.price_per_hour desc, h.created_at desc',
  'age-asc': 'h.age asc, h.created_at desc',
  'rating-desc': 'coalesce(r.rating, 0) desc, coalesce(r.reviews_count, 0) desc',
  'new-desc': 'h.created_at desc',
}

const REVIEW_SORTS: Record<string, string> = {
  new: 'rv.created_at desc',
  old: 'rv.created_at asc',
  best: 'rv.rating desc, rv.created_at desc',
  worst: 'rv.rating asc, rv.created_at desc',
}

function idOr404(value: string | string[] | undefined): string {
  const id = Array.isArray(value) ? value[0] : value
  if (!id || !UUID_RE.test(id)) throw notFound()
  return id
}

async function findHooker(id: string | string[] | undefined): Promise<HookerRow> {
  const hooker = await one<HookerRow>(
    `select ${HOOKER_COLUMNS} from hookers h ${HOOKER_JOIN} where h.id = $1`,
    [idOr404(id)],
  )
  if (!hooker) throw notFound()
  return hooker
}

hookersRouter.get(
  '/hookers',
  handle(async (req, res) => {
    const params = parseBody(listQuerySchema, req.query)
    const where: string[] = ['h.is_published']
    const values: unknown[] = []

    if (params.q) {
      values.push(`%${params.q.toLowerCase()}%`)
      where.push(`(lower(h.name) like $${values.length} or lower(h.city) like $${values.length} or lower(h.district) like $${values.length})`)
    }
    if (params.city) {
      values.push(params.city)
      where.push(`h.city = $${values.length}`)
    }
    if (params.district) {
      values.push(params.district)
      where.push(`h.district = $${values.length}`)
    }
    if (params.service) {
      values.push(params.service)
      where.push(`$${values.length} = any(h.services)`)
    }
    if (params.ids) {
      const ids = params.ids.split(',').map((id) => id.trim()).filter((id) => UUID_RE.test(id))
      if (ids.length === 0) return res.json({ items: [], total: 0, page: params.page, limit: params.limit, hasMore: false, cities: config.cities })
      values.push(ids)
      where.push(`h.id = any($${values.length}::uuid[])`)
    }
    if (params.minPrice) {
      values.push(params.minPrice)
      where.push(`h.price_per_hour >= $${values.length}`)
    }
    if (params.maxPrice) {
      values.push(params.maxPrice)
      where.push(`h.price_per_hour <= $${values.length}`)
    }
    if (params.hasPhoto) {
      where.push(`(h.main_photo <> '' or coalesce(array_length(h.photos, 1), 0) > 0)`)
    }
    if (params.reviewed) {
      where.push(`exists (select 1 from reviews rv where rv.hooker_id = h.id)`)
    }
    if (params.center) {
      where.push(
        `h.district = any(array['Пресня','Хамовники','Сити','Басманный','Центр','Таганский','Арбат','Тверской'])`,
      )
    }

    const clause = where.length > 0 ? `where ${where.join(' and ')}` : ''
    values.push(params.limit, (params.page - 1) * params.limit)
    const limitRef = `$${values.length - 1}`
    const offsetRef = `$${values.length}`

    const rows = await query<HookerRow & { total_count: string }>(
      `select ${HOOKER_COLUMNS}, count(*) over() as total_count
       from hookers h
       ${HOOKER_JOIN}
       ${clause}
       order by ${SORTS[params.sort] ?? SORTS['price-asc']}
       limit ${limitRef} offset ${offsetRef}`,
      values,
    )

    const total = rows[0] ? Number(rows[0].total_count) : 0
    res.json({
      items: rows.map(toView),
      total,
      page: params.page,
      limit: params.limit,
      hasMore: params.page * params.limit < total,
      cities: config.cities,
    })
  }),
)

hookersRouter.get(
  '/hookers/:id',
  attachUser,
  handle(async (req, res) => {
    const hooker = await findHooker(req.params.id)
    // Неоплаченная анкета видна только владельцу.
    if (!hooker.is_published && hooker.owner_id !== req.user?.id) throw notFound()

    // Просмотр пишем только для чужих анкет и только авторизованным.
    if (req.user && hooker.owner_id !== req.user.id) {
      await one(
        `insert into history (user_id, hooker_id, viewed_at) values ($1, $2, now())
         on conflict (user_id, hooker_id) do update set viewed_at = now()`,
        [req.user.id, hooker.id],
      )
    }

    res.json(toView(hooker))
  }),
)

hookersRouter.post(
  '/hookers',
  requireAuth,
  handle(async (req, res) => {
    const input = parseBody(listingSchema, req.body)
    const rows = await query<{ id: string }>(
      `insert into hookers (owner_id, name, age, city, district, region, phone, height, price_per_hour, services, about, photos, main_photo, is_published)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false)
       returning id`,
      [
        currentUser(req).id,
        input.name,
        input.age,
        input.city,
        input.district ?? '',
        input.region,
        input.phone,
        input.height,
        input.pricePerHour,
        input.services,
        input.about,
        input.photos,
        input.mainPhoto || input.photos[0] || '',
      ],
    )
    res.status(201).json(toView(await findHooker(rows[0]!.id)))
  }),
)

hookersRouter.patch(
  '/hookers/:id',
  requireAuth,
  handle(async (req, res) => {
    const existing = await findHooker(req.params.id)
    if (existing.owner_id && existing.owner_id !== currentUser(req).id) {
      throw forbidden('Это чужая анкета')
    }

    const input = parseBody(listingSchema, {
      name: req.body?.name ?? existing.name,
      age: req.body?.age ?? existing.age,
      city: req.body?.city ?? existing.city,
      district: req.body?.district ?? existing.district,
      region: req.body?.region ?? existing.region,
      phone: req.body?.phone ?? existing.phone,
      height: req.body?.height ?? existing.height,
      pricePerHour: req.body?.pricePerHour ?? existing.price_per_hour,
      services: req.body?.services ?? existing.services,
      about: req.body?.about ?? existing.about,
      photos: req.body?.photos ?? existing.photos,
      mainPhoto: req.body?.mainPhoto ?? existing.main_photo,
    })

    await one(
      `update hookers set name = $2, age = $3, city = $4, district = $5, region = $6,
              phone = $7, height = $8, price_per_hour = $9, services = $10, about = $11,
              photos = $12, main_photo = $13
       where id = $1`,
      [
        existing.id,
        input.name,
        input.age,
        input.city,
        input.district ?? '',
        input.region,
        input.phone,
        input.height,
        input.pricePerHour,
        input.services,
        input.about,
        input.photos,
        input.mainPhoto || input.photos[0] || '',
      ],
    )
    res.json(toView(await findHooker(existing.id)))
  }),
)

hookersRouter.delete(
  '/hookers/:id',
  requireAuth,
  handle(async (req, res) => {
    const existing = await findHooker(req.params.id)
    if (existing.owner_id && existing.owner_id !== currentUser(req).id) {
      throw forbidden('Это чужая анкета')
    }
    await one('delete from hookers where id = $1', [existing.id])
    res.status(204).end()
  }),
)

// ——— отзывы ———

hookersRouter.get(
  '/hookers/:id/reviews',
  handle(async (req, res) => {
    const hooker = await findHooker(req.params.id)
    const sort = reviewSortSchema.parse(req.query.sort ?? 'new')

    const rows = await query<ReviewRow>(
      `select rv.id, rv.author_id, u.name as author, rv.rating, rv.text, rv.created_at
       from reviews rv
       join users u on u.id = rv.author_id
       where rv.hooker_id = $1
       order by ${REVIEW_SORTS[sort] ?? REVIEW_SORTS.new}`,
      [hooker.id],
    )
    res.json({ items: rows.map(toReview), total: rows.length })
  }),
)

hookersRouter.post(
  '/hookers/:id/reviews',
  requireAuth,
  handle(async (req, res) => {
    const hooker = await findHooker(req.params.id)
    const input = parseBody(reviewSchema, req.body)
    const author = currentUser(req)

    // Свою анкету владелец отзывом не оценивает: рейтинг — мнение клиентов.
    if (hooker.owner_id === author.id) {
      throw conflict('Свою анкету оценить отзывом нельзя')
    }

    let review: ReviewRow
    try {
      const rows = await query<ReviewRow>(
        `insert into reviews (hooker_id, author_id, rating, text)
         values ($1, $2, $3, $4)
         returning id, author_id, rating, text, created_at`,
        [hooker.id, author.id, input.rating, input.text],
      )
      review = rows[0]!
    } catch (error) {
      // Уникальный индекс (hooker_id, author_id) — дубль отзыва.
      if ((error as { code?: string }).code === '23505') {
        throw conflict('Вы уже оставили отзыв этой анкете')
      }
      throw error
    }

    res.status(201).json(toReview({ ...review, author: author.name }))
  }),
)
