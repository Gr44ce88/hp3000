import { useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { HookerCard } from '@/components/widgets/HookerCard'
import { SortFilterBar } from '@/components/widgets/SortFilterBar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { fetchHookers } from '@/features/hookers/api'
import type { FilterKey, SortKey } from '@/features/hookers/sorting'
import { useSessionStore } from '@/features/auth/store'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/api'
import { useViewModeStore } from '@/stores/viewMode'

const PAGE_SIZE = 12
const FILTER_OUTSIDE_AUTH = ['with-photo', 'up-to-3000', 'reviewed', 'center'] as const

export default function HomePage() {
  const [sort, setSort] = useState<SortKey>('price-asc')
  const [filters, setFilters] = useState<FilterKey[]>([])
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [city, setCity] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [page, setPage] = useState(1)

  const token = useSessionStore((state) => state.token)
  const favoritesQuery = useFavoriteIds()
  const favorites = favoritesQuery.data ?? []
  const toggleFavoriteMutation = useToggleFavorite()
  const mode = useViewModeStore((state) => state.mode)
  const setMode = useViewModeStore((state) => state.setMode)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const onlyFavorites = filters.includes('favorites')

  const hookers = useQuery({
    queryKey: ['hookers', debounced, city, minPrice, maxPrice, sort, page, onlyFavorites, favorites],
    queryFn: ({ signal }) =>
      fetchHookers(
        {
          q: debounced || undefined,
          city: city || undefined,
          minPrice: Number(minPrice) || undefined,
          maxPrice: Number(maxPrice) || undefined,
          sort,
          page,
          limit: PAGE_SIZE,
          ids: onlyFavorites ? favorites : undefined,
        },
        signal,
      ),
    placeholderData: keepPreviousData,
  })

  const visible = useMemo(() => {
    const items = hookers.data?.items ?? []
    return items.filter((item) => {
      if (filters.includes('up-to-3000') && item.pricePerHour > 3000) return false
      if (filters.includes('reviewed') && item.reviewsCount === 0) return false
      return true
    })
  }, [hookers.data, filters])

  const toggleFilter = (filter: FilterKey) => {
    setPage(1)
    setFilters((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter],
    )
  }

  const resetAll = () => {
    setPage(1)
    setFilters([])
    setQuery('')
    setCity('')
    setMinPrice('')
    setMaxPrice('')
  }

  const total = hookers.data?.total ?? 0

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-content">Анкеты</h1>
          <p className="mt-0.5 text-[11px] text-content-muted tabular-nums">
            {hookers.isSuccess ? `Найдено ${total}` : 'Загружаем каталог'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div role="group" aria-label="Вид карточек" className="flex gap-1 rounded-full bg-chip p-1">
            {(
              [
                ['grid', 'Книжная'],
                ['list', 'Альбомная'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className={
                  mode === value
                    ? 'h-6 rounded-full bg-surface-elevated px-2.5 text-[11px] font-medium text-content ring-1 ring-hairline'
                    : 'h-6 rounded-full px-2.5 text-[11px] text-content-muted hover:text-content'
                }
              >
                {label}
              </button>
            ))}
          </div>
          <Button size="sm" variant="secondary" onClick={() => void hookers.refetch()}>
            Обновить
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-6 sm:flex-row">
        <aside className="sm:w-56 sm:shrink-0">
          <div className="sticky top-[3.5rem] space-y-3">
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Имя, район или город"
              aria-label="Поиск анкет"
              className="h-8 text-xs sm:text-xs"
            />

            <select
              value={city}
              onChange={(event) => {
                setCity(event.target.value)
                setPage(1)
              }}
              aria-label="Город"
              className="h-8 w-full rounded-md bg-chip px-2 text-xs text-content focus:outline-none"
            >
              <option value="">Все города</option>
              {(hookers.data?.cities ?? []).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <Input
                value={minPrice}
                onChange={(event) => {
                  setMinPrice(event.target.value.replace(/\D/g, ''))
                  setPage(1)
                }}
                placeholder="от ₽"
                aria-label="Цена от"
                inputMode="numeric"
                className="h-8 text-xs sm:text-xs"
              />
              <Input
                value={maxPrice}
                onChange={(event) => {
                  setMaxPrice(event.target.value.replace(/\D/g, ''))
                  setPage(1)
                }}
                placeholder="до ₽"
                aria-label="Цена до"
                inputMode="numeric"
                className="h-8 text-xs sm:text-xs"
              />
            </div>

            <SortFilterBar
              vertical
              sort={sort}
              onSortChange={(value) => {
                setSort(value)
                setPage(1)
              }}
              activeFilters={filters}
              availableFilters={token ? undefined : FILTER_OUTSIDE_AUTH}
              onToggleFilter={toggleFilter}
              onReset={resetAll}
            />

            <Button size="sm" variant="ghost" onClick={resetAll}>
              Сбросить всё
            </Button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {hookers.isPending && (
            <div className="mt-4">
              <Spinner label="Загружаем анкеты" />
            </div>
          )}

          {hookers.isError && (
            <div className="mt-2 rounded-lg bg-surface-elevated p-4 text-xs ring-1 ring-hairline">
              <p className="text-[13px] font-medium text-content">
                {[502, 504].includes((hookers.error as { status?: number }).status ?? 0)
                  ? 'Сервер не отвечает.'
                  : 'Не удалось загрузить анкеты.'}
              </p>
              <p className="mt-1 text-content-muted">Проверьте соединение и нажмите «Обновить».</p>
            </div>
          )}

          {hookers.isSuccess && visible.length === 0 && (
            <div className="rounded-lg bg-mat p-8 text-center ring-1 ring-dashed ring-hairline">
              <p className="text-sm font-medium text-content">
                {onlyFavorites ? 'В избранном пусто' : 'Под условия ничего не подошло'}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-content-muted">
                {onlyFavorites
                  ? 'Жмите ♡ на карточке, чтобы сохранить анкету.'
                  : 'Ослабьте фильтры или измените поиск.'}
              </p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={resetAll}>
                Сбросить всё
              </Button>
            </div>
          )}

          {visible.length > 0 && (
            <>
              <ul
                className={
                  mode === 'grid'
                    ? 'grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-3'
                    : 'space-y-3'
                }
              >
                {visible.map((item) => (
                  <li key={item.id} className="min-w-0">
                    <HookerCard
                      id={item.id}
                      name={item.name}
                      age={item.age}
                      city={item.city}
                      pricePerHour={item.pricePerHour}
                      height={item.height}
                      about={item.about}
                      services={item.services.join(', ')}
                      rating={item.rating}
                      reviewsCount={item.reviewsCount}
                      isNew={item.isNew}
                      orientation={mode === 'list' ? 'landscape' : 'portrait'}
                      isFavorite={favorites.includes(item.id)}
                      onToggleFavorite={
                        token
                          ? (id) => toggleFavoriteMutation.mutate({ id, favorite: favorites.includes(id) })
                          : undefined
                      }
                      href={`/hookers/${item.id}`}
                    />
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-center gap-3 py-8">
                {hookers.data?.hasMore ? (
                  <Button size="sm" onClick={() => setPage((value) => value + 1)}>
                    Показать ещё
                  </Button>
                ) : (
                  <span className="text-[11px] text-content-muted">Это все {total} анкет</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
