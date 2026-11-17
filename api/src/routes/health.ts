import { Router } from 'express'
import { one } from '../db/pool.ts'
import { handle } from '../http/respond.ts'

export const healthRouter: Router = Router()

healthRouter.get(
  '/health',
  handle(async (_req, res) => {
    const counters = await one<{ hookers: string; users: string }>(
      'select (select count(*) from hookers) as hookers, (select count(*) from users) as users',
    )
    res.json({
      status: 'ok',
      uptime: Math.round(process.uptime()),
      hookers: Number(counters?.hookers ?? 0),
      users: Number(counters?.users ?? 0),
    })
  }),
)
