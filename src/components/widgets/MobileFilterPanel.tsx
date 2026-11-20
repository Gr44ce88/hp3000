import { useState } from 'react'
import { ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { FILTER_OPTIONS, type FilterKey, type SortKey } from '@/features/hookers/sorting'
import { SERVICES } from '@/features/hookers/schema'
import { cn } from '@/lib/cn'

export type MobileFilterPanelProps = {
  sort: SortKey
  onSortChange: (sort: SortKey) => void
  city: string
  cities: string[]
  onCityChange: (city: string) => void
  minPrice: string
  maxPrice: string
  onMinPriceChange: (value: string) => void
  onMaxPriceChange: (value: string) => void
  activeFilters: FilterKey[]
  availableFilters?: readonly FilterKey[]
  onToggleFilter: (filter: FilterKey) => void
  service: string
  onServiceChange: (service: string) => void
  onReset: () => void
  /** сколько условий уже включено */
  count: number
  /** сколько анкет нашлось — на кнопке «Показать» */
  resultCount: number
  className?: string
}

/** Телефонная панель: свёрнута в одну строку, раскрывается по нажатию. */
export function MobileFilterPanel({
  sort,
  onSortChange,
  city,
  cities,
  onCityChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  activeFilters,
  availableFilters,
  onToggleFilter,
  service,
  onServiceChange,
  onReset,
  count,
  resultCount,
  className,
}: MobileFilterPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('rounded-lg bg-surface-elevated ring-1 ring-hairline', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-filters"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-full items-center gap-2 px-3 text-xs text-content"
      >
        <SlidersHorizontal className="size-4 text-content-muted" aria-hidden="true" />
        <span className="font-medium">Фильтры и сортировка</span>
        {count > 0 && (
          <span className="grid size-4 place-items-center rounded-full bg-accent text-[10px] font-semibold text-white tabular-nums">
            {count}
          </span>
        )}
        <ChevronDown
          className={cn('ml-auto size-4 text-content-muted transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id="mobile-filters" className="space-y-3 border-t border-hairline p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] tracking-wide text-content-muted uppercase">
                Город
              </span>
              <select
                value={city}
                onChange={(event) => onCityChange(event.target.value)}
                className="h-9 w-full rounded-md bg-chip px-2 text-xs text-content focus:outline-none"
              >
                <option value="">Все города</option>
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] tracking-wide text-content-muted uppercase">
                Сортировка
              </span>
              <select
                value={sort}
                onChange={(event) => onSortChange(event.target.value as SortKey)}
                className="h-9 w-full rounded-md bg-chip px-2 text-xs text-content focus:outline-none"
              >
                <option value="price-asc">Сначала дешевле</option>
                <option value="price-desc">Сначала дороже</option>
                <option value="age-asc">Моложе</option>
                <option value="rating-desc">По рейтингу</option>
                <option value="new-desc">Сначала новые</option>
              </select>
            </label>
          </div>

          <div>
            <span className="mb-1 block text-[11px] tracking-wide text-content-muted uppercase">
              Цена, ₽
            </span>
            <div className="flex gap-2">
              <Input
                value={minPrice}
                onChange={(event) => onMinPriceChange(event.target.value.replace(/\D/g, ''))}
                placeholder="от"
                aria-label="Цена от"
                inputMode="numeric"
                className="h-9 text-xs sm:text-xs"
              />
              <Input
                value={maxPrice}
                onChange={(event) => onMaxPriceChange(event.target.value.replace(/\D/g, ''))}
                placeholder="до"
                aria-label="Цена до"
                inputMode="numeric"
                className="h-9 text-xs sm:text-xs"
              />
            </div>
          </div>

          <div>
            <span className="mb-1 block text-[11px] tracking-wide text-content-muted uppercase">
              Фильтры
            </span>
            <div className="flex flex-wrap gap-1.5">
              {FILTER_OPTIONS.filter(
                (option) => !availableFilters || availableFilters.includes(option.value),
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={activeFilters.includes(option.value)}
                  onClick={() => onToggleFilter(option.value)}
                  className={
                    activeFilters.includes(option.value)
                      ? 'h-9 rounded-full bg-chip px-3 text-xs font-medium text-content ring-1 ring-content/15'
                      : 'h-9 rounded-full bg-chip px-3 text-xs text-content-muted hover:text-content'
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {onServiceChange && (
            <div>
              <span className="mb-1 block text-[11px] tracking-wide text-content-muted uppercase">
                Услуга
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {SERVICES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={service === option}
                    onClick={() => onServiceChange(service === option ? '' : option)}
                    className={cn(
                      'h-7 truncate rounded-full px-2 text-[11px]',
                      service === option
                        ? 'bg-chip font-medium text-content ring-1 ring-content/15'
                        : 'bg-chip text-content-muted hover:text-content',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="sticky bottom-0 -mx-3 -mb-3 flex items-center gap-2 rounded-b-lg border-t border-hairline bg-surface-elevated px-3 py-2">
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 text-[11px] text-content-muted underline underline-offset-2 hover:text-content"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              Сбросить
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto inline-flex h-10 items-center rounded-full bg-accent px-3 text-xs font-medium text-white"
            >
              Показать {resultCount}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
