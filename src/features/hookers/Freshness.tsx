import { useState } from 'react'
export function Freshness({ at }: { at?: string | null }) {
  const [today] = useState(() => new Date())
  if (!at) return null
  const date = new Date(at)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const when =
    date.toDateString() === today.toDateString()
      ? 'сегодня'
      : date.toDateString() === yesterday.toDateString()
        ? 'вчера'
        : date.toLocaleDateString('ru-RU')
  return (
    <p className="text-content-muted text-xs">
      Цена и контакт подтверждены автором <time dateTime={at}>{when}</time>
    </p>
  )
}
