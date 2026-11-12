import { z } from 'zod'

const email = z.email('Некорректный e-mail')
const password = z.string().min(8, 'Минимум 8 символов')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Введите пароль'),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Минимум 2 символа').max(60, 'Слишком длинно'),
    email,
    password,
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    path: ['confirm'],
    message: 'Пароли не совпадают',
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Минимум 2 символа').max(60, 'Слишком длинно'),
  email: z.email('Некорректный e-mail'),
})

export type ProfileValues = z.infer<typeof profileSchema>
