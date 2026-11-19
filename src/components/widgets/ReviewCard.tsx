import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ReviewCardProps = {
  author: string
  text: string
  /** 1–5, дробные допустимы */
  rating: number
  createdAt?: string
  className?: string
}

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

/** Отзыв: автор, оценка 1–5 и текст. */
export function ReviewCard({ author, text, rating, createdAt, className }: ReviewCardProps) {
  const score = Math.min(5, Math.max(1, Math.round(rating)))

  return (
    <article
      className={cn(
        'rounded-lg bg-surface-elevated p-4 ring-1 ring-hairline',
        className,
      )}
    >
      <header className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-mat text-xs font-medium text-content-muted"
        >
          {author.slice(0, 1).toUpperCase()}
        </span>

        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-content">{author}</p>
          <p className="text-xs text-content-muted">
            {createdAt ? dateFormat.format(new Date(createdAt)) : 'без даты'}
          </p>
        </div>

        <Stars score={score} className="ml-auto" />
      </header>

      <p className="mt-2.5 text-[13px] whitespace-pre-line text-content">{text}</p>
    </article>
  )
}

export function Stars({ score, className }: { score: number; className?: string }) {
  const value = Math.min(5, Math.max(0, score))

  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      role="img"
      aria-label={`Оценка ${value} из 5`}
    >
      <span aria-hidden="true" className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={cn('size-3.5', index < value ? 'fill-rating text-rating' : 'text-line')}
          />
        ))}
      </span>
      <span className="text-xs font-medium text-content-muted tabular-nums">{value}/5</span>
    </span>
  )
}
