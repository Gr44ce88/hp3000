import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { HookerCard } from '@/components/widgets/HookerCard'
import { SortFilterBar } from '@/components/widgets/SortFilterBar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { fetchHookers } from '@/features/hookers/api'
import { FILTER_OPTIONS, SORT_OPTIONS, type FilterKey, type SortKey } from '@/features/hookers/sorting'
import { useSessionStore } from '@/features/auth/store'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/api'
import { useViewModeStore } from '@/stores/viewMode'

const PAGE_SIZE = 12
/** Фильтр «До 3 000 ₽» превращается в потолок цены. */
const CHEAP_LIMIT = 3000
const FILTER_OUTSIDE_AUTH = ['with-photo', 'up-to-3000', 'reviewed', 'center'] as const

const isFilterKey = (value: string): value is FilterKey =>
  FILTER_OPTIONS.some((option) => option.value === value)

const isSortKey = (value: string | null): value is SortKey =>
  SORT_OPTIONS.some((option) => option.value === value)

export default function HomePage() {
  const [params, setParams] = useSearchParams()

  // Всё состояние каталога живёт в адресной строке: переживает перезагрузку и шарится ссылкой.
  const query = params.get('q') ?? ''
  const city = params.get('city') ?? ''
  const minPrice = params.get('min') ?? ''
  const maxPrice = params.get('max') ?? ''
  const sortParam = params.get('sort')
  const sort: SortKey = isSortKey(sortParam) ? sortParam : 'price-asc'
  const filters = (params.get('f') ?? '').split(',').filter(isFilterKey)
  const onlyFavorites = filters.includes('favorites')

  const [search, setSearch] = useState(query)

  const token = useSessionStore((state) => state.token)
  const favoritesQuery = useFavoriteIds()
  const favorites = favoritesQuery.data ?? []
  const toggleFavoriteMutation = useToggleFavorite()
  const mode = useViewModeStore((state) => state.mode)
  const setMode = useViewModeStore((state) => state.setMode)

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    setParams(next, { replace: true })
  }

  // Ввод в поиске дебаунсим и только потом пишем в адрес.
  useEffect(() => {
    const timer = setTimeout(() => {
      const value = search.trim()
      const current = params.get('q') ?? ''
      if (value === current) return
      const next = new URLSearchParams(params)
      if (value) next.set('q', value)
      else next.delete('q')
      setParams(next, { replace: true })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const maxPriceEffective = filters.includes('up-to-3000')
    ? String(Math.min(Number(maxPrice) || CHEAP_LIMIT, CHEAP_LIMIT))
    : maxPrice

  const list = useInfiniteQuery({
    queryKey: [
      'hookers',
      { q: query, city, minPrice, maxPrice: maxPriceEffective, sort, filters, ids: onlyFavorites ? favorites : [] },
    ],
    queryFn: ({ pageParam, signal }) =>
      fetchHookers(
        {
          q: query || undefined,
          city: city || undefined,
          minPrice: Number(minPrice) || undefined,
          maxPrice: Number(maxPriceEffective) || undefined,
          sort,
          page: pageParam,
          limit: PAGE_SIZE,
          ids: onlyFavorites ? favorites : undefined,
          hasPhoto: filters.includes('with-photo') || undefined,
          reviewed: filters.includes('reviewed') || undefined,
          center: filters.includes('center') || undefined,
        },
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    // Старые данные держим на экране, пока грузится новая выборка.
    placeholderData: keepPreviousData,
    // Фильтр избранного при пустом списке: ждать нечего, показываем пустое состояние.
    enabled: !onlyFavorites || favorites.length > 0,
  })

  const pages = list.data?.pages ?? []
  const favoritesReady = !onlyFavorites || favoritesQuery.isSuccess
  // Пустое избранное: запрос не нужен, а старые данные мешать не должны.
  const favoritesEmpty = onlyFavorites && favoritesQuery.isSuccess && favorites.length === 0
  const items = favoritesEmpty ? [] : pages.flatMap((page) => page.items)
  const total = favoritesEmpty ? 0 : (pages[0]?.total ?? 0)
  const showEmpty = items.length === 0 && favoritesReady && (list.isSuccess || favoritesEmpty)

  const toggleFilter = (filter: FilterKey) => {
    const next = filters.includes(filter)
      ? filters.filter((item) => item !== filter)
      : [...filters, filter]
    update({ f: next.join(',') })
  }

  const resetAll = () => {
    setSearch('')
    setParams(new URLSearchParams(), { replace: true })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-content">Анкеты</h1>
          <p className="mt-0.5 text-[11px] text-content-muted tabular-nums" aria-live="polite">
            {list.isSuccess ? `Найдено ${total}` : 'Загружаем каталог'}
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
          <Button size="sm" variant="secondary" onClick={() => void list.refetch()}>
            Обновить
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-6 sm:flex-row">
        <aside className="sm:w-56 sm:shrink-0">
          <div className="sticky top-[3.5rem] space-y-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Имя, район или город"
              aria-label="Поиск анкет"
              type="search"
              className="h-8 text-xs sm:text-xs"
            />

            <select
              value={city}
              onChange={(event) => update({ city: event.target.value })}
              aria-label="Город"
              className="h-8 w-full rounded-md bg-chip px-2 text-xs text-content focus:outline-none"
            >
              <option value="">Все города</option>
              {(list.data?.pages[0]?.cities ?? []).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <Input
                value={minPrice}
                onChange={(event) => update({ min: event.target.value.replace(/\D/g, '') })}
                placeholder="от ₽"
                aria-label="Цена от"
                inputMode="numeric"
                className="h-8 text-xs sm:text-xs"
              />
              <Input
                value={maxPrice}
                onChange={(event) => update({ max: event.target.value.replace(/\D/g, '') })}
                placeholder="до ₽"
                aria-label="Цена до"
                inputMode="numeric"
                className="h-8 text-xs sm:text-xs"
              />
            </div>

            <SortFilterBar
              vertical
              sort={sort}
              onSortChange={(value) => update({ sort: value })}
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
          {list.isPending && (
            <div className="mt-4">
              <Spinner label="Загружаем анкеты" />
            </div>
          )}

          {list.isError && (
            <div className="mt-2 rounded-lg bg-surface-elevated p-4 text-xs ring-1 ring-hairline">
              <p className="text-[13px] font-medium text-content">
                {[502, 504].includes((list.error as { status?: number }).status ?? 0)
                  ? 'Сервер не отвечает.'
                  : 'Не удалось загрузить анкеты.'}
              </p>
              <p className="mt-1 text-content-muted">Проверьте соединение и нажмите «Обновить».</p>
            </div>
          )}

          {showEmpty && (
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

          {items.length > 0 && (
            <>
              <ul
                className={
                  mode === 'grid'
                    ? 'grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-3'
                    : 'space-y-3'
                }
              >
                {items.map((item) => (
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
                      photoUrl={item.photos[0]}
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

              <div className="flex flex-col items-center gap-2 py-8">
                {list.hasNextPage && (
                  <Button
                    size="sm"
                    isLoading={list.isFetchingNextPage}
                    onClick={() => void list.fetchNextPage()}
                  >
                    Показать ещё
                  </Button>
                )}
                <span className="text-[11px] text-content-muted tabular-nums">
                  Показано {items.length} из {total}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
