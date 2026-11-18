import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Подхватываем .env из корня проекта, не перетирая уже заданные переменные. */
function loadDotEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
      if (!match) continue
      const [, key, value] = match
      if (!key || value === undefined) continue
      if (process.env[key] !== undefined) continue
      process.env[key] = value.replace(/^["']|["']$/g, '')
    }
  } catch {
    // .env может отсутствовать — тогда всё берётся из окружения
  }
}

loadDotEnv()

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Не задана переменная окружения ${name} (см. .env.example)`)
  return value
}

export const config = {
  port: Number(process.env.PORT ?? 8080),
  databaseUrl: required('DATABASE_URL'),
  /** Срок жизни сессии в днях — токен в БД хранится хэшем. */
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS ?? 30),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  pageLimitMax: 24,
  /** Города, доступные в фильтре каталога. Тот же список — src/features/hookers/cities.ts. */
  cities: ['Москва', 'Химки', 'Одинцово', 'Люберцы', 'Красногорск'],
  /** Комиссия за публикацию анкеты, ₽. */
  publicationFee: Number(process.env.PUBLICATION_FEE ?? 490),
  freekassa: {
    merchantId: process.env.FREEKASSA_MERCHANT_ID ?? '',
    /** Секретное слово для подписи платёжной формы. */
    secret1: process.env.FREEKASSA_SECRET_1 ?? '',
    /** Секретное слово 2 — для проверки подписи оповещения. */
    secret2: process.env.FREEKASSA_SECRET_2 ?? '',
    currency: process.env.FREEKASSA_CURRENCY ?? 'RUB',
    formUrl: process.env.FREEKASSA_FORM_URL ?? 'https://pay.fk.money/',
    /** Белый список IP FreeKassa включается только в проде. */
    checkIp: process.env.FREEKASSA_CHECK_IP === 'true',
    allowedIps: ['168.119.157.136', '168.119.60.227', '178.154.197.79', '51.250.54.238'] as readonly string[],
    /** Какие валюты предлагать под выбранный способ оплаты (ID из доков FreeKassa). */
    currenciesByMethod: {
      card: '4,8,12',
      sbp: '13',
      crypto: '15,24,25,26',
    } as Record<string, string>,
  },
} as const
