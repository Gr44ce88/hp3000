/**
 * Демо-данные для разработки: демо-аккаунт (demo@hookers.local / demo12345),
 * аккаунты-авторы отзывов и пачка анкет для проверки каталога, фильтров
 * и пагинации. Запуск: npm run db:seed (объём — SEED_COUNT, по умолчанию 72).
 * Повторный запуск безопасен: прошлые сид-анкеты и сид-отзывы удаляются.
 * Обложки: npm run db:covers (public/seed).
 */
import { hashPassword } from '../auth/passwords.ts'
import { closePool, one, query, withTransaction } from './pool.ts'

const DEMO_EMAIL = 'demo@hookers.local'
const DEMO_PASSWORD = 'demo12345'

const COUNT = Math.max(6, Number(process.env.SEED_COUNT ?? 72))
const AUTHOR_COUNT = 8
const COVERS = 8
const URL_COVER = (n: number) => `/seed/${((n - 1) % COVERS) + 1}.svg`

const NAMES = [
  'Аня', 'Милана', 'Кира', 'Ева', 'Лада', 'Соня', 'Вероника', 'Диана', 'Рита', 'Лера',
  'Настя', 'Оля', 'Алина', 'Кристина', 'Марина', 'Юля', 'Саша', 'Вика', 'Даша', 'Полина',
  'Снежана', 'Мила', 'Агата', 'Лиза', 'Есения', 'Тая', 'Ариша', 'Ника', 'Стеша', 'Руся',
  'Алиса', 'Яна', 'Злата', 'Агния', 'Мирослава', 'Василиса', 'Ульяна', 'Камила', 'Амелия', 'Ева-Мария',
]

const CITIES = [
  { city: 'Москва', region: 'Москва и область' },
  { city: 'Химки', region: 'Московская область' },
  { city: 'Одинцово', region: 'Московская область' },
  { city: 'Люберцы', region: 'Московская область' },
  { city: 'Красногорск', region: 'Московская область' },
] as const

const DISTRICTS = [
  'Пресня', 'Хамовники', 'Сити', 'Басманный', 'Центр', 'Таганский',
  'Арбат', 'Тверской', 'Сокол', 'Черёмушки', 'Коньково', 'Левобережный',
] as const

const SERVICES = [
  'Классика', 'Минет', 'Анал', 'МБР', 'Массаж',
  'Тантрический массаж', 'GFE', 'Эскорт', 'Ужин', 'Выезд',
] as const

const ABOUT = [
  'Спокойная, без спешки. Встречаюсь в квартире у метро, душ есть.',
  'Модельная внешность, разговариваю на английском.',
  'Тихая квартира в центре, парковка во дворе.',
  'Принимаю до полуночи, звонок за час.',
  'Выезд в отель, сопровождаю на мероприятия.',
  'Ухоженная, общаюсь легко, без спешки.',
  'Своё место, отдельный вход, свежее бельё.',
  'Не курю, работаю по записи, только чистые встречи.',
] as const

const REVIEW_TEXTS = [
  'Всё как на фото, встреча прошла спокойно и без спешки.',
  'Очень уютно, чисто, общение приятное. Вернусь ещё.',
  'Пунктуальна, обстановка отличная, всё по договорённости.',
  'Фото соответствуют, атмосфера тёплая, рекомендую.',
  'Хороший вариант в этом районе, всё честно.',
  'Приятная, внимательная, время не тянула.',
  'Интерьер и отношение на уровне, детали обсудили заранее.',
]

/** Детерминированный генератор: сид не должен прыгать между запусками. */
let seed = 20261119
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const pick = <T,>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!
const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1))

async function main(): Promise<void> {
  const passwordHash = await hashPassword(DEMO_PASSWORD)
  const authorHash = await hashPassword('smoke12345')

  await withTransaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `insert into users (email, name, phone, password_hash, is_demo)
       values ($1, $2, $3, $4, true)
       on conflict (email) do update set name = excluded.name, is_demo = true
       returning id`,
      [DEMO_EMAIL, 'Аня', '+7 900 000-00-00', passwordHash],
    )
    const demoId = rows[0]!.id

    // Прошлый сид: анкеты демо и сид-авторов, их отзывы, сами авторы.
    await client.query(
      `delete from hookers where owner_id is null or owner_id = $1
         or owner_id in (select id from users where email like 'seed-author-%@test.local')`,
      [demoId],
    )
    await client.query(`delete from users where email like 'seed-author-%@test.local'`)

    const authors: string[] = []
    for (let i = 1; i <= AUTHOR_COUNT; i += 1) {
      const created = await client.query<{ id: string }>(
        `insert into users (email, name, phone, password_hash)
         values ($1, $2, $3, $4) returning id`,
        [`seed-author-${i}@test.local`, `Гость ${i}`, '', authorHash],
      )
      authors.push(created.rows[0]!.id)
    }

    let reviews = 0
    for (let index = 0; index < COUNT; index += 1) {
      const mine = index < 3
      const place = index % 5 === 0 ? pick(CITIES) : CITIES[0]
      const district = place.city === 'Москва' ? pick(DISTRICTS) : pick(['Центр', 'Левобережный'])
      const photoCount = index % 4 === 0 ? 0 : between(1, 3)
      const photos = Array.from({ length: photoCount }, (_, n) => URL_COVER(index + n + 1))
      const services = Array.from(new Set(Array.from({ length: between(1, 3) }, () => pick(SERVICES))))
      const createdAt = new Date(Date.UTC(2026, 0, 2 + index, 8 + (index % 12), 15)).toISOString()

      const inserted = await client.query<{ id: string }>(
        `insert into hookers (owner_id, name, age, city, district, region, phone, height,
                              price_per_hour, services, about, photos, main_photo, is_new, is_published, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, $15)
         returning id`,
        [
          mine ? demoId : null,
          NAMES[index % NAMES.length]!,
          between(18, 45),
          place.city,
          district,
          place.region,
          `+7 915 ${String(100 + (index % 800)).padStart(3, '0')}-${String(10 + (index % 80)).padStart(2, '0')}-${String(index % 90).padStart(2, '0')}`,
          between(155, 185),
          between(1, 24) * 500,
          services,
          ABOUT[index % ABOUT.length]!,
          photos,
          photos[0] ?? '',
          index < 6,
          createdAt,
        ],
      )
      const hookerId = inserted.rows[0]!.id

      // Отзывы не на каждую анкету: фильтр «С отзывами» должен что-то отсекать.
      if (index % 3 === 2) {
        const start = index % (AUTHOR_COUNT - 2)
        const slice = authors.slice(start, start + between(1, 4))
        for (const authorId of slice) {
          await client.query(
            `insert into reviews (hooker_id, author_id, rating, text)
             values ($1, $2, $3, $4) on conflict do nothing`,
            [hookerId, authorId, between(3, 5), pick(REVIEW_TEXTS)],
          )
          reviews += 1
        }
      }
    }

    console.log(`Анкет создано: ${COUNT}, отзывов: ${reviews}`)
  })

  const counters = await one<{ hookers: string }>('select count(*) as hookers from hookers')
  console.log(`Демо-аккаунт: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
  console.log(`Анкет в базе: ${counters?.hookers ?? 0}`)
  const sessions = await query('select 1 from users where email = $1', [DEMO_EMAIL])
  console.log(sessions.length > 0 ? 'Готово' : 'Что-то не так — демо-аккаунт не создан')
}

main()
  .catch((error: unknown) => {
    console.error('Сид упал:', error)
    process.exitCode = 1
  })
  .finally(() => closePool())
