import type { FilterKey, SortKey } from '@/features/hookers/sorting'
import { FILTER_OPTIONS, SORT_OPTIONS } from '@/features/hookers/sorting'
import { cn } from '@/lib/cn'

export type SortFilterBarProps = {
  sort: SortKey
  onSortChange: (sort: SortKey) => void
  activeFilters: FilterKey[]
  onToggleFilter: (filter: FilterKey) => void
  /** какие фильтры показывать; по умолчанию все */
  availableFilters?: readonly FilterKey[]
  /** вертикальная раскладка для сайдбара */
  vertical?: boolean
  onReset?: () => void
  resultCount?: number
  className?: string
}

const pill =
  'inline-flex h-7 shrink-0 items-center rounded-full px-3 text-xs transition-colors'
const pillIdle = 'bg-chip text-content-muted hover:text-content'
const pillActive = 'bg-chip text-content font-medium ring-1 ring-content/15'

/** Кнопки сортировки и фильтрации: пилюли 28px, активная — заливка чернилами. */
export function SortFilterBar({
  sort,
  onSortChange,
  activeFilters,
  onToggleFilter,
  availableFilters,
  vertical = false,
  onReset,
  resultCount,
  className,
}: SortFilterBarProps) {
  const hasActive = activeFilters.length > 0

  return (
    <div className={cn(vertical ? 'space-y-4' : 'flex flex-wrap items-center gap-x-3 gap-y-2', className)}>
      <span id="sort-label" className="block text-[11px] tracking-wide text-content-muted uppercase">
        Сортировка
      </span>
      <div role="group" aria-labelledby="sort-label" className={cn('flex gap-1.5', vertical ? 'flex-col items-start' : 'flex-wrap')}>
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={sort === option.value}
            onClick={() => onSortChange(option.value)}
            className={cn(pill, sort === option.value ? pillActive : pillIdle)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {!vertical && <span aria-hidden="true" className="mx-1 hidden h-4 w-px bg-hairline sm:block" />}
      <span className="block text-[11px] tracking-wide text-content-muted uppercase">Фильтры</span>
      <div className={cn('flex gap-1.5', vertical ? 'flex-col items-start' : 'flex-wrap')}>
        {FILTER_OPTIONS.filter(
          (option) => !availableFilters || availableFilters.includes(option.value),
        ).map((option) => {
          const active = activeFilters.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onToggleFilter(option.value)}
              className={cn(pill, active ? pillActive : pillIdle)}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {hasActive && (
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] text-content-muted underline underline-offset-2 hover:text-content"
        >
          Сбросить
        </button>
      )}

      {resultCount !== undefined && (
        <span className="ml-auto text-[11px] text-content-muted tabular-nums">
          Найдено: {resultCount}
        </span>
      )}
    </div>
  )
}
