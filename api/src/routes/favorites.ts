import { Router } from 'express'
import { currentUser, requireAuth } from '../auth/middleware.ts'
import { one, query } from '../db/pool.ts'
import { notFound } from '../http/errors.ts'
import { idOr404 } from '../http/ids.ts'
import { handle } from '../http/respond.ts'
import { HOOKER_COLUMNS, HOOKER_JOIN, type HookerRow } from '../views.ts'

export const favoritesRouter: Router = Router()

favoritesRouter.get(
  '/favorites',
  requireAuth,
  handle(async (req, res) => {
    const rows = await query<{ hooker_id: string }>(
      'select hooker_id from favorites where user_id = $1 order by created_at desc',
      [currentUser(req).id],
    )
    res.json({ ids: rows.map((row) => row.hooker_id) })
  }),
)

favoritesRouter.put(
  '/favorites/:id',
  requireAuth,
  handle(async (req, res) => {
    const id = idOr404(req.params.id)
    const hooker = await one<HookerRow>(
      `select ${HOOKER_COLUMNS} from hookers h ${HOOKER_JOIN} where h.id = $1`,
      [id],
    )
    if (!hooker) throw notFound()
    await one(
      'insert into favorites (user_id, hooker_id) values ($1, $2) on conflict do nothing',
      [currentUser(req).id, hooker.id],
    )
    res.status(204).end()
  }),
)

favoritesRouter.delete(
  '/favorites/:id',
  requireAuth,
  handle(async (req, res) => {
    await one('delete from favorites where user_id = $1 and hooker_id = $2', [
      currentUser(req).id,
      idOr404(req.params.id),
    ])
    res.status(204).end()
  }),
)
