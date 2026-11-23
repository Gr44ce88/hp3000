import { Link } from 'react-router-dom'
import { Heart, MapPin, Star } from 'lucide-react'
import { cn } from '@/lib/cn'

export type HookerCardProps = {
  name: string
  age: number
  district?: string
  stationDistance?: string
  catalogUrl?: string
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
  district,
  stationDistance,
  catalogUrl,
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
        'card-media relative overflow-hidden bg-mat',
        portrait ? 'aspect-[5/4] w-full' : 'h-40 w-40 shrink-0 sm:h-48 sm:w-56',
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
          className="monogram grid size-full place-items-center"
          aria-hidden="true"
        >
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}

      {rating !== undefined && Boolean(reviewsCount) && (
        <span className="absolute top-1.5 left-1.5 inline-flex h-5 items-center gap-1 rounded-full bg-black/45 px-1.5 text-[11px] font-medium text-white tabular-nums backdrop-blur">
          <Star className="size-3 fill-rose text-rose" aria-hidden="true" />
          {rating.toFixed(1)}
          {reviewsCount !== undefined && (
            <span className="border-l border-white/30 pl-1.5 font-normal text-white/80 tabular-nums">
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
          {isFavorite ? (
            <Heart className="size-3.5 fill-brand-500 text-brand-500" aria-hidden="true" />
          ) : (
            <Heart className="size-3.5" aria-hidden="true" />
          )}
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
    <div className={cn('flex min-w-0 flex-1 flex-col', portrait ? 'card-body' : 'p-3')}>
      <div className="flex items-baseline gap-1.5">
        <h3 className="card-name truncate">{name},</h3>
        <span className="shrink-0 text-[11px] text-content-muted tabular-nums">{age}</span>
      </div>

      <p className="flex items-center gap-1 truncate text-[11px] text-content-muted">
        <MapPin className="size-3 shrink-0 text-content-muted/70" aria-hidden="true" />
        <span className="truncate">{district || city}</span>
      </p>

      {stationDistance && <p className="mt-1 text-xs text-content">{stationDistance}</p>}
      {height !== undefined && !portrait && <p className="text-xs text-content-muted">{height} см · {city}</p>}
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
          'font-semibold text-brand-600 tabular-nums',
          portrait ? 'card-price' : 'mt-auto pt-2 text-sm',
        )}
      >
        {money.format(pricePerHour)} ₽
        <span className="ml-1 text-xs font-normal text-content-muted">/час</span>
      </p>
    </div>
  )

  return (
    <article
      className={cn(
        'listing-card group relative flex min-w-0 flex-col overflow-hidden rounded-lg bg-surface-elevated ring-1 ring-hairline',
        'transition-[box-shadow,background-color] hover:ring-content/25 focus-within:ring-content/40',
        portrait ? 'h-full' : 'max-h-[300px] flex-row',
        width === 'quarter' && (portrait ? 'w-1/2 shrink-0 sm:w-1/4' : 'w-full'),
      )}
    >
      {media}
      {body}

      {href && (
        <Link to={href} state={catalogUrl ? { catalogUrl } : undefined} className="absolute inset-0" aria-label={`Анкета: ${name}, ${age}, ${city}${district ? `, ${district}` : ''}${stationDistance ? ', ' + stationDistance : ''}, ${money.format(pricePerHour)} ₽/час`}>
          <span className="sr-only">Открыть анкету</span>
        </Link>
      )}
    </article>
  )
}
