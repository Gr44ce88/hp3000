import { Router } from 'express'
import { currentUser, requireAuth } from '../auth/middleware.ts'
import { hashPassword, verifyPassword } from '../auth/passwords.ts'
import { createSession, dropSession, publicUser, userByToken, type UserRow } from '../auth/sessions.ts'
import { one, query } from '../db/pool.ts'
import { conflict, unauthorized } from '../http/errors.ts'
import { handle, parseBody } from '../http/respond.ts'
import { loginSchema, meSchema, registerSchema } from '../schemas.ts'
import { HOOKER_COLUMNS, HOOKER_JOIN, toReview, toView, type HookerRow, type ReviewRow } from '../views.ts'

export const authRouter: Router = Router()

type UserWithHash = UserRow & { password_hash: string }

authRouter.post(
  '/auth/register',
  handle(async (req, res) => {
    const input = parseBody(registerSchema, req.body)
    const hashed = await hashPassword(input.password)

    let user: UserRow
    try {
      const rows = await query<UserRow>(
        `insert into users (email, name, password_hash)
         values ($1, $2, $3)
         returning id, email, name, phone, avatar_url`,
        [input.email, input.name, hashed],
      )
      user = rows[0]!
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw conflict('Такой e-mail уже занят')
      throw error
    }

    const token = await createSession(user.id)
    res.status(201).json({ token, user: publicUser(user) })
  }),
)

authRouter.post(
  '/auth/login',
  handle(async (req, res) => {
    const input = parseBody(loginSchema, req.body)
    const user = await one<UserWithHash>(
      `select id, email, name, phone, avatar_url, password_hash
       from users where lower(email) = lower($1)`,
      [input.email],
    )
    if (!user || !(await verifyPassword(input.password, user.password_hash))) {
      throw unauthorized()
    }
    const token = await createSession(user.id)
    res.json({ token, user: publicUser(user) })
  }),
)

authRouter.post(
  '/auth/demo',
  handle(async (_req, res) => {
    const user = await one<UserRow>(
      'select id, email, name, phone, avatar_url from users where is_demo order by created_at limit 1',
    )
    if (!user) throw new Error('Демо-аккаунт не заведён — выполните npm run db:seed')
    const token = await createSession(user.id)
    res.json({ token, user: publicUser(user) })
  }),
)

authRouter.post(
  '/auth/logout',
  handle(async (req, res) => {
    const token = (req.header('authorization') ?? '').replace(/^Bearer\s+/, '').trim()
    if (token && (await userByToken(token))) await dropSession(token)
    res.status(204).end()
  }),
)

authRouter.get(
  '/me',
  requireAuth,
  handle(async (req, res) => {
    res.json({ user: publicUser(currentUser(req)) })
  }),
)

authRouter.patch(
  '/me',
  requireAuth,
  handle(async (req, res) => {
    const user = currentUser(req)
    const input = parseBody(meSchema, {
      name: req.body?.name ?? user.name,
      email: req.body?.email ?? user.email,
      phone: req.body?.phone ?? user.phone,
    })

    const taken = await one<{ id: string }>(
      'select id from users where lower(email) = lower($1) and id <> $2',
      [input.email, user.id],
    )
    if (taken) throw conflict('Адрес занят другим аккаунтом')

    const rows = await query<UserRow>(
      `update users set name = $2, email = $3, phone = $4
       where id = $1
       returning id, email, name, phone, avatar_url`,
      [user.id, input.name, input.email, input.phone ?? ''],
    )
    res.json({ user: publicUser(rows[0]!) })
  }),
)

authRouter.get(
  '/me/hookers',
  requireAuth,
  handle(async (req, res) => {
    const rows = await query<HookerRow>(
      `select ${HOOKER_COLUMNS} from hookers h ${HOOKER_JOIN}
       where h.owner_id = $1 order by h.created_at desc`,
      [currentUser(req).id],
    )
    const items = rows.map(toView)
    res.json({ items, total: items.length })
  }),
)

authRouter.get(
  '/me/reviews',
  requireAuth,
  handle(async (req, res) => {
    const rows = await query<ReviewRow & { hooker_id: string; hooker_name: string }>(
      `select r.id, r.author_id, u.name as author, r.rating, r.text, r.created_at,
              h.id as hooker_id, h.name as hooker_name
       from reviews r
       join users u on u.id = r.author_id
       join hookers h on h.id = r.hooker_id
       where r.author_id = $1
       order by r.created_at desc`,
      [currentUser(req).id],
    )
    const items = rows.map((row) => ({
      ...toReview(row),
      hookerId: row.hooker_id,
      hookerName: row.hooker_name,
    }))
    res.json({ items, total: items.length })
  }),
)

authRouter.get(
  '/me/history',
  requireAuth,
  handle(async (req, res) => {
    const rows = await query<HookerRow & { viewed_at: Date }>(
      `select ${HOOKER_COLUMNS}, v.viewed_at
       from history v
       join hookers h on h.id = v.hooker_id
       ${HOOKER_JOIN}
       where v.user_id = $1
       order by v.viewed_at desc
       limit 20`,
      [currentUser(req).id],
    )
    res.json({
      items: rows.map((row) => ({ ...toView(row), viewedAt: new Date(row.viewed_at).toISOString() })),
      total: rows.length,
    })
  }),
)
