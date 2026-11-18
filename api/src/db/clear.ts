/**
 * Очистка данных: схема остаётся, все записи удаляются.
 * Нужно, чтобы смотреть сайт в состоянии «как после деплоя».
 * Запуск: npm run db:clear. Наполнить обратно — npm run db:seed.
 */
import { closePool, one } from './pool.ts'

async function main(): Promise<void> {
  await one(
    `truncate table history, favorites, reviews, hookers, sessions, users restart identity cascade`,
  )
  const counters = await one<{ hookers: string; users: string }>(
    'select (select count(*) from hookers) as hookers, (select count(*) from users) as users',
  )
  console.log(`База очищена: анкет ${counters?.hookers ?? 0}, пользователей ${counters?.users ?? 0}`)
}

main()
  .catch((error: unknown) => {
    console.error('Очистка упала:', error)
    process.exitCode = 1
  })
  .finally(() => closePool())
