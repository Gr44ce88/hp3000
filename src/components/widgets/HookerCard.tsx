import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

export type HookerCardProps = {
  name: string
  age: number
  city: string
  pricePerHour: number
  height?: number
  services?: string
  about?: string
  photoUrl?: string
  rating?: number
  reviewsCount?: number
  orientation?: 'landscape' | 'portrait'
  /** quarter — фиксированная четверть контейнера (витрина в ряд), fluid — по ячейке сетки */
  width?: 'fluid' | 'quarter'
  /** true — метка «новое» рукописным акцентом */
  isNew?: boolean
  isFavorite?: boolean
  onToggleFavorite?: (id: string) => void
  id?: string
  href?: string
}

const money = new Intl.NumberFormat('ru-RU')

/** Карточка анкеты: мат под медиа, hairline-рамка, цена чернилами. */
export function HookerCard({
  name,
  age,
  city,
  pricePerHour,
  height,
  services,
  about,
  photoUrl,
  rating,
  reviewsCount,
  orientation = 'portrait',
  width = 'fluid',
  isNew = false,
  isFavorite = false,
  onToggleFavorite,
  id,
  href,
}: HookerCardProps) {
  const portrait = orientation === 'portrait'

  const media = (
    <div
      className={cn(
        'relative overflow-hidden bg-mat',
        portrait ? 'aspect-square w-full' : 'h-40 w-40 shrink-0 sm:h-48 sm:w-56',
      )}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div
          className="grid size-full place-items-center text-2xl font-medium text-content-muted/70"
          aria-hidden="true"
        >
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}

      {rating !== undefined && (
        <span className="absolute top-1.5 left-1.5 inline-flex h-5 items-center rounded-full bg-black/45 px-1.5 text-[11px] font-medium text-white tabular-nums backdrop-blur">
          ★ {rating.toFixed(1)}
          {reviewsCount !== undefined && (
            <span className="ml-1.5 border-l border-white/30 pl-1.5 font-normal text-white/80 tabular-nums">
              {reviewsCount}
            </span>
          )}
        </span>
      )}

      {onToggleFavorite && id && (
        <button
          type="button"
          data-slot="favorite"
          onClick={() => onToggleFavorite(id)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Убрать из избранного: ${name}` : `В избранное: ${name}`}
          className="absolute top-1.5 right-1.5 z-10 grid size-6 place-items-center rounded-full bg-black/45 text-[11px] text-white backdrop-blur transition-colors hover:bg-black/65"
        >
          {isFavorite ? '♥' : '♡'}
        </button>
      )}

      {isNew && (
        <span className="absolute right-1.5 bottom-1.5 -rotate-3 text-[11px] font-semibold text-brand-600 dark:text-brand-300">
          новое!
        </span>
      )}
    </div>
  )

  const body = (
    <div className={cn('flex min-w-0 flex-1 flex-col', portrait ? 'px-2 py-1.5' : 'p-3')}>
      <div className="flex items-baseline gap-1.5">
        <h3 className="truncate text-[13px] font-medium text-content">{name},</h3>
        <span className="shrink-0 text-[11px] text-content-muted tabular-nums">{age}</span>
      </div>

      <p className="truncate text-[11px] text-content-muted">
        {city}
        {height !== undefined && ` · ${height} см`}
      </p>

      {about && (
        <p
          className={cn(
            'mt-0.5 text-[11px] leading-snug text-content-muted',
            portrait ? 'line-clamp-1' : 'line-clamp-2',
          )}
        >
          {about}
        </p>
      )}

      {services && !portrait && (
        <p className="mt-0.5 line-clamp-1 text-[11px] text-content-muted">{services}</p>
      )}

      <p
        className={cn(
          'font-medium text-content tabular-nums',
          portrait ? 'mt-1 text-[13px]' : 'mt-auto pt-2 text-sm',
        )}
      >
        {money.format(pricePerHour)} ₽
        <span className="text-[11px] font-normal text-content-muted">/час</span>
      </p>
    </div>
  )

  return (
    <article
      className={cn(
        'group relative flex min-w-0 flex-col overflow-hidden rounded-lg bg-surface-elevated ring-1 ring-hairline',
        'transition-[box-shadow,background-color] hover:ring-content/25 focus-within:ring-content/40',
        portrait ? 'h-full' : 'max-h-[300px] flex-row',
        width === 'quarter' && (portrait ? 'w-1/2 shrink-0 sm:w-1/4' : 'w-full'),
      )}
    >
      {media}
      {body}

      {href && (
        <Link to={href} className="absolute inset-0" aria-label={`Анкета: ${name}, ${age}, ${city}`}>
          <span className="sr-only">Открыть анкету</span>
        </Link>
      )}
    </article>
  )
}
