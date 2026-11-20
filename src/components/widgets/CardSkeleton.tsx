import { cn } from '@/lib/cn'

/** Плейсхолдер карточки на время загрузки каталога. */
export function CardSkeleton({ landscape = false }: { landscape?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex animate-pulse overflow-hidden rounded-lg bg-surface-elevated ring-1 ring-hairline motion-reduce:animate-none',
        landscape ? 'h-40 flex-row' : 'flex-col',
      )}
    >
      <div className={cn('bg-mat', landscape ? 'h-full w-40 shrink-0 sm:w-56' : 'aspect-square w-full')} />
      <div className={cn('flex flex-1 flex-col gap-2', landscape ? 'p-3' : 'px-2 py-2')}>
        <div className="h-3 w-2/3 rounded-full bg-chip" />
        <div className="h-2.5 w-1/2 rounded-full bg-chip" />
        <div className="h-2.5 w-5/6 rounded-full bg-chip" />
        <div className="mt-auto h-3.5 w-16 rounded-full bg-chip" />
      </div>
    </div>
  )
}
