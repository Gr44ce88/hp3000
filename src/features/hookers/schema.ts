import { z } from 'zod'
import { CITIES } from '@/features/hookers/cities'

/** Заглушка: сумму и способы оплаты определим, когда подключим платежи. */
export const PUBLICATION_COMMISSION = 490
export const COMMISSION_CURRENCY = '₽'

export const PAYMENT_METHODS = [
  { value: 'card', label: 'Карта', hint: 'Visa / Mastercard / МИР' },
  { value: 'sbp', label: 'СБП', hint: 'По QR-коду' },
  { value: 'crypto', label: 'Крипта', hint: 'USDT TRC-20' },
  { value: 'balance', label: 'Баланс', hint: 'Скоро', disabled: true },
] as const

/** Услуги для выбора в анкете — одна на анкету, набор как на профильных площадках. */
export const SERVICES = [
  'Классика',
  'Минет',
  'Анал',
  'МБР',
  'Массаж',
  'Тантрический массаж',
  'GFE',
  'Эскорт',
  'Ужин',
  'Выезд',
] as const

export type Service = (typeof SERVICES)[number]

/** Сколько фото разрешено в анкете. */
export const PHOTOS_MAX = 6

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value']

export const listingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Минимум 2 символа')
    .max(60, 'Не длиннее 60 символов'),
  age: z.coerce.number('Введите возраст').int().min(18, 'От 18 лет').max(80, 'Не больше 80'),
  city: z.enum(CITIES, 'Выберите город'),
  district: z.string().trim().max(60, 'Не длиннее 60 символов').optional(),
  region: z.string().trim().min(2, 'Укажите регион').max(60, 'Не длиннее 60 символов'),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s()-]{9,18}$/, 'Формат: +7 900 000-00-00'),
  height: z.coerce.number('Введите рост').int().min(140, 'От 140 см').max(210, 'До 210 см'),
  pricePerHour: z.coerce.number('Укажите цену').int().min(1, 'Минимум 1').max(500_000),
  /** Чекбоксы услуг: можно выбрать несколько. */
  services: z.array(z.string()).max(SERVICES.length, 'Слишком много услуг').default([]),
  photos: z.array(z.string()).max(PHOTOS_MAX, `Не больше ${PHOTOS_MAX} фото`).default([]),
  mainPhoto: z.string().optional(),
  about: z.string().trim().max(255, 'Не больше 255 символов').optional(),
  paymentMethod: z.enum(
    PAYMENT_METHODS.filter((method) => !('disabled' in method)).map(
      (method) => method.value,
    ) as [PaymentMethod, ...PaymentMethod[]],
    'Выберите способ оплаты',
  ),
})

export type ListingValues = z.output<typeof listingSchema>
export type ListingInput = z.input<typeof listingSchema>
