import { describe, expect, it } from 'vitest'
import { titleFor } from '@/app/titles'

describe('titleFor', () => {
  it('даёт заголовок динамическим маршрутам', () => {
    expect(titleFor('/hookers/abc-123')).toBe('Анкета')
    expect(titleFor('/hookers/abc-123/edit')).toBe('Редактирование анкеты')
    expect(titleFor('/profile/edit')).toBe('Редактирование профиля')
    expect(titleFor('/favorites')).toBe('Избранное')
  })

  it('не путает корень и каталог', () => {
    expect(titleFor('/')).toBe('Главная')
    expect(titleFor('/hookers')).toBe('Анкеты')
  })

  it('возвращает undefined для незнакомого адреса', () => {
    expect(titleFor('/nope/deep')).toBeUndefined()
  })
})
