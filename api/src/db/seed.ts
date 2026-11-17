/**
 * Демо-данные для разработки: демо-аккаунт (demo@hookers.local / demo12345)
 * и шесть анкет, три из которых принадлежат демо-аккаунту.
 * Запуск: npm run db:seed. Повторный запуск безопасен.
 */
import { hashPassword } from '../auth/passwords.ts'
import { closePool, one, query, withTransaction } from './pool.ts'

const DEMO_EMAIL = 'demo@hookers.local'
const DEMO_PASSWORD = 'demo12345'

const HOOKERS = [
  { name: 'Аня', age: 24, city: 'Москва', district: 'Пресня', region: 'Москва и область', phone: '+7 915 100-10-01', height: 170, pricePerHour: 5000, services: ['Классика', 'GFE', 'Массаж'], about: 'Спокойная, без спешки. Встречаюсь в квартире у метро, душ есть.', mine: true },
  { name: 'Милана', age: 27, city: 'Москва', district: 'Хамовники', region: 'Москва и область', phone: '+7 915 100-10-02', height: 176, pricePerHour: 3500, services: ['Классика', 'Тантрический массаж'], about: 'Модельная внешность, разговариваю на английском.', mine: true },
  { name: 'Кира', age: 22, city: 'Химки', district: 'Левобережный', region: 'Московская область', phone: '+7 915 100-10-03', height: 165, pricePerHour: 2800, services: ['Классика'], about: 'Первая анкета, работаю недавно.', mine: true },
  { name: 'Ева', age: 31, city: 'Москва', district: 'Сити', region: 'Москва и область', phone: '+7 915 100-10-04', height: 168, pricePerHour: 9000, services: ['Классика', 'GFE', 'Ужин'], about: 'Выезд в отель, сопровождаю на мероприятия.', mine: false },
  { name: 'Лада', age: 26, city: 'Москва', district: 'Басманный', region: 'Москва и область', phone: '+7 915 100-10-05', height: 172, pricePerHour: 4500, services: ['Классика', 'Массаж'], about: 'Тихая квартира в центре, парковка во дворе.', mine: false },
  { name: 'Соня', age: 20, city: 'Одинцово', district: 'Центр', region: 'Московская область', phone: '+7 915 100-10-06', height: 160, pricePerHour: 2500, services: ['Классика'], about: 'Студентка, беру только до 22:00.', mine: false },
  // Кластер в центре — чтобы тепловая карта показывала реальную плотность, а не одиночные точки.
  { name: 'Вероника', age: 29, city: 'Москва', district: 'Пресня', region: 'Москва и область', phone: '+7 915 100-10-07', height: 174, pricePerHour: 6000, services: ['Классика', 'GFE'], about: 'Работаю в квартире у Патриарших, есть парковка.', mine: false },
  { name: 'Диана', age: 25, city: 'Москва', district: 'Пресня', region: 'Москва и область', phone: '+7 915 100-10-08', height: 168, pricePerHour: 5200, services: ['Классика', 'Массаж'], about: 'Тихая, без спешки, принимаю до полуночи.', mine: false },
  { name: 'Рита', age: 23, city: 'Москва', district: 'Хамовники', region: 'Москва и область', phone: '+7 915 100-10-09', height: 165, pricePerHour: 4000, services: ['Классика'], about: 'Пять минут от метро, встречаю в халате.', mine: false },
  { name: 'Лера', age: 32, city: 'Москва', district: 'Хамовники', region: 'Москва и область', phone: '+7 915 100-10-10', height: 171, pricePerHour: 5500, services: ['Классика', 'Ужин'], about: 'Спокойные вечера, разговор на любые темы.', mine: false },
  { name: 'Настя', age: 21, city: 'Москва', district: 'Басманный', region: 'Москва и область', phone: '+7 915 100-10-11', height: 163, pricePerHour: 3000, services: ['Классика'], about: 'Студентка, принимаю после учёбы.', mine: false },
  { name: 'Оля', age: 28, city: 'Москва', district: 'Таганский', region: 'Москва и область', phone: '+7 915 100-10-12', height: 169, pricePerHour: 4800, services: ['Классика', 'GFE'], about: 'Квартира у Таганки, отдельный вход.', mine: false },
] as const

async function main(): Promise<void> {
  const passwordHash = await hashPassword(DEMO_PASSWORD)

  await withTransaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `insert into users (email, name, phone, password_hash, is_demo)
       values ($1, $2, $3, $4, true)
       on conflict (email) do update set name = excluded.name, is_demo = true
       returning id`,
      [DEMO_EMAIL, 'Аня', '+7 900 000-00-00', passwordHash],
    )
    const demoId = rows[0]!.id

    await client.query('delete from hookers where owner_id is null or owner_id = $1', [demoId])

    let index = 0
    for (const item of HOOKERS) {
      const createdAt = new Date(Date.UTC(2026, 0, 4 + index * 2, 9, 12)).toISOString()
      await client.query(
        `insert into hookers (owner_id, name, age, city, district, region, phone, height, price_per_hour, services, about, is_new, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          item.mine ? demoId : null,
          item.name,
          item.age,
          item.city,
          item.district,
          item.region,
          item.phone,
          item.height,
          item.pricePerHour,
          item.services,
          item.about,
          item.mine ? true : index === 5,
          createdAt,
        ],
      )
      index += 1
    }
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
