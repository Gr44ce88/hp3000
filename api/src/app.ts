import cors from 'cors'
import express, { type Express } from 'express'
import { config } from './config.ts'
import { errorMiddleware } from './http/respond.ts'
import { notFound } from './http/errors.ts'
import { authRouter } from './routes/auth.ts'
import { favoritesRouter } from './routes/favorites.ts'
import { healthRouter } from './routes/health.ts'
import { hookersRouter } from './routes/hookers.ts'
import { statsRouter } from './routes/stats.ts'

export function createApp(): Express {
  const app = express()

  app.disable('x-powered-by')
  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, !origin || config.corsOrigins.includes(origin))
      },
      credentials: false,
    }),
  )
  app.use(express.json({ limit: '256kb' }))

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    if (req.path !== '/api/health') {
      console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`)
    }
    next()
  })

  app.use('/api', healthRouter)
  app.use('/api', authRouter)
  app.use('/api', hookersRouter)
  app.use('/api', favoritesRouter)
  app.use('/api', statsRouter)

  app.use('/api', (_req, _res, next) => next(notFound()))
  app.use(errorMiddleware)

  return app
}
