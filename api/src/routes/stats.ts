import { Router } from 'express'
import { query } from '../db/pool.ts'
import { handle } from '../http/respond.ts'

export const statsRouter: Router = Router()

/** Плотность анкет по районам — данные для тепловой карты. */
statsRouter.get(
  '/stats/districts',
  handle(async (_req, res) => {
    const rows = await query<{ district: string; city: string; count: string }>(
      `select district, city, count(*) as count
       from hookers
       where district <> ''
       group by district, city
       order by count(*) desc, district asc`,
    )
    const items = rows.map((row) => ({
      district: row.district,
      city: row.city,
      count: Number(row.count),
    }))
    res.json({ items, total: items.length })
  }),
)
