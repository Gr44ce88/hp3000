import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { closePool, withTransaction } from './pool.ts'

const MIGRATIONS_DIR = resolve(import.meta.dirname, '../../migrations')

async function ensureTable(): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      'create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())',
    )
  })
}

async function applied(): Promise<Set<string>> {
  const { rows } = await withTransaction((client) =>
    client.query<{ name: string }>('select name from schema_migrations'),
  )
  return new Set(rows.map((row) => row.name))
}

/** Накатывает неприменённые миграции по одной, каждую в своей транзакции. */
/** Полный сброс схемы для `npm run db:reset`. */
async function reset(): Promise<void> {
  await withTransaction(async (client) => {
    await client.query('drop schema public cascade')
    await client.query('create schema public')
  })
  console.log('Схема сброшена')
}

async function main(): Promise<void> {
  if (process.argv.includes('reset')) await reset()
  await ensureTable()
  const done = await applied()
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  let counter = 0
  for (const file of files) {
    if (done.has(file)) continue
    const sql = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8')
    process.stdout.write(`применяю ${file} … `)
    await withTransaction(async (client) => {
      await client.query(sql)
      await client.query('insert into schema_migrations (name) values ($1)', [file])
    })
    console.log('готово')
    counter += 1
  }

  console.log(counter === 0 ? 'Все миграции уже применены' : `Применено миграций: ${counter}`)
}

main()
  .catch((error: unknown) => {
    console.error('Миграции упали:', error)
    process.exitCode = 1
  })
  .finally(() => closePool())
