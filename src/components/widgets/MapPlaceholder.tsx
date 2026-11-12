import { cn } from '@/lib/cn'

export type MapPlaceholderProps = {
  address?: string
  className?: string
}

/** Заглушка карты: картинка вместо интерактивного Яндекс.Карт. */
export function MapPlaceholder({ address, className }: MapPlaceholderProps) {
  return (
    <figure
      className={cn(
        'relative overflow-hidden rounded-lg bg-mat ring-1 ring-hairline',
        className,
      )}
    >
      <img
        src="/map-placeholder.svg"
        alt={address ? `Карта: ${address}` : 'Карта района'}
        loading="lazy"
        className="aspect-[2/1] w-full object-cover"
      />

      <span className="absolute top-2 left-2 inline-flex h-5 items-center rounded-full bg-black/45 px-2 text-[11px] font-medium text-white backdrop-blur">
        Заглушка · Яндекс.Карты
      </span>

      <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/70 to-black/0 p-3 pt-8">
        <span className="text-sm text-white">{address ?? 'Адрес не указан'}</span>
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-900 opacity-80"
          title="Подключим после интеграции с API карт"
        >
          Открыть в картах
        </button>
      </figcaption>
    </figure>
  )
}
