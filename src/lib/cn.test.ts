import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/cn'

const off = false as boolean

describe('cn', () => {
  it('мержит конфликтующие утилиты, последняя выигрывает', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('отбрасывает ложные значения', () => {
    expect(cn('text-sm', off && 'x', undefined, 'font-bold')).toBe('text-sm font-bold')
  })
})
