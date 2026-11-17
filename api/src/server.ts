import { createApp } from './app.ts'
import { config } from './config.ts'
import { closePool, one } from './db/pool.ts'
import { purgeExpiredSessions } from './auth/sessions.ts'

const app = createApp()

const server = app.listen(config.port, () => {
  console.log(`API слушает http://localhost:${config.port}`)
})

async function healthcheck(): Promise<void> {
  const row = await one<{ hookers: string }>('select count(*) as hookers from hookers')
  console.log(`Готово записей: ${row?.hookers ?? 0}`)
}

healthcheck().catch((error: unknown) => console.error('БД недоступна:', error))

// Раз в час подчищаем просроченные сессии, чтобы таблица не пухла.
const cleanup = setInterval(() => {
  purgeExpiredSessions().catch((error: unknown) => console.error('Чистка сессий:', error))
}, 3_600_000)
cleanup.unref()

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal}: останавливаюсь`)
  server.close(() => {
    void closePool().finally(() => process.exit(0))
  })
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
