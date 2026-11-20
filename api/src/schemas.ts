import { z } from 'zod'
import { config } from './config.ts'

const email = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Проверьте адрес')

const phone = z
  .string()
  .trim()
  .regex(/^[+\d][\d\s()-]{8,18}$/, 'Телефон: +7 900 000-00-00')

export const registerSchema = z.object({
  email,
  password: z.string().min(8, 'Минимум 8 символов').max(200),
  name: z.string().trim().min(2, 'Минимум 2 символа').max(60, 'Не больше 60 символов'),
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Введите пароль'),
})

export const meSchema = z.object({
  name: z.string().trim().min(2, 'Имя: от 2 до 60 символов').max(60, 'Имя: от 2 до 60 символов'),
  email,
  phone: phone.or(z.literal('')).optional(),
  avatarUrl: z.string().trim().max(300, 'Слишком длинный адрес фото').optional(),
})

export const listingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Имя: от 2 до 60 символов')
    .max(60, 'Имя: от 2 до 60 символов'),
  age: z.coerce.number().int('Возраст целым числом').min(18, 'Возраст: 18–80').max(80, 'Возраст: 18–80'),
  city: z.enum(config.cities, { message: `Город: один из ${config.cities.join(', ')}` }),
  district: z.string().trim().max(60).optional(),
  region: z
    .string()
    .trim()
    .min(2, 'Регион: от 2 до 60 символов')
    .max(60, 'Регион: от 2 до 60 символов'),
  phone,
  height: z.coerce.number().int('Рост целым числом').min(140, 'Рост: 140–210 см').max(210, 'Рост: 140–210 см'),
  pricePerHour: z.coerce
    .number()
    .int('Цена целым числом')
    .min(1, 'Цена: целое число больше нуля'),
  services: z.array(z.string().trim().min(1)).max(10).default([]),
  photos: z.array(z.string().trim().min(1)).max(6, 'Не больше 6 фото').default([]),
  mainPhoto: z.string().trim().optional(),
  about: z.string().trim().max(255, 'Описание: не больше 255 символов').default(''),
})

export const reviewSchema = z.object({
  rating: z.coerce.number().int('Оценка: целое 1–5').min(1, 'От 1 до 5').max(5, 'От 1 до 5'),
  text: z
    .string()
    .trim()
    .min(10, 'От 10 до 1000 символов')
    .max(1000, 'От 10 до 1000 символов'),
})

export const listQuerySchema = z.object({
  q: z.string().trim().max(60).optional(),
  city: z.string().trim().optional(),
  service: z.string().trim().max(60).optional(),
  ids: z.string().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  hasPhoto: z.coerce.number().int().min(0).max(1).optional(),
  reviewed: z.coerce.number().int().min(0).max(1).optional(),
  center: z.coerce.number().int().min(0).max(1).optional(),
  sort: z.enum(['price-asc', 'price-desc', 'age-asc', 'rating-desc', 'new-desc']).default('price-asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(config.pageLimitMax).default(12),
})

export const reviewSortSchema = z.enum(['new', 'old', 'best', 'worst']).default('new')

export const paymentSchema = z.object({
  hookerId: z.string().min(1, 'Не указана анкета'),
  method: z.enum(['card', 'sbp', 'crypto'], 'Способ оплаты: карта, СБП или крипта'),
})

export type ListingInput = z.infer<typeof listingSchema>
