import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  ArrowUpDown,
  Banknote,
  FilePlus2,
  Heart,
  LayoutGrid,
  MapPin,
  RefreshCw,
  RotateCcw,
  Rows3,
  Search,
  SearchX,
  SlidersHorizontal,
  Tags,
} from 'lucide-react'
import { Popover, PopoverOption } from '@/components/ui/Popover'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { HookerCard } from '@/components/widgets/HookerCard'
import { MobileFilterPanel } from '@/components/widgets/MobileFilterPanel'
import { CardSkeleton } from '@/components/widgets/CardSkeleton'
import { ScrollTopButton } from '@/components/widgets/ScrollTopButton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

import { fetchHookers } from '@/features/hookers/api'
import { DISTRICT_COORDS } from '@/features/hookers/coords'
import { FILTER_OPTIONS, SORT_OPTIONS, type FilterKey, type SortKey } from '@/features/hookers/sorting'
import { useSessionStore } from '@/features/auth/store'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { SERVICES } from '@/features/hookers/schema'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/api'
import { useViewModeStore } from '@/stores/viewMode'

const PAGE_SIZE = 12
/** Фильтр «До 3 000 ₽» превращается в потолок цены. */
const CHEAP_LIMIT = 3000
const FILTER_OUTSIDE_AUTH = ['with-photo', 'up-to-3000', 'reviewed', 'center'] as const
/** Районы для фильтра: те же, что размечены на карте. */
const DISTRICTS = Object.keys(DISTRICT_COORDS)

const isFilterKey = (value: string): value is FilterKey =>
  FILTER_OPTIONS.some((option) => option.value === value)

const isSortKey = (value: string | null): value is SortKey =>
  SORT_OPTIONS.some((option) => option.value === value)

export default function HomePage() {
  const [params, setParams] = useSearchParams()

  // Всё состояние каталога живёт в адресной строке: переживает перезагрузку и шарится ссылкой.
  const query = params.get('q') ?? ''
  const city = params.get('city') ?? ''
  const district = params.get('district') ?? ''
  const service = params.get('service') ?? ''
  const minPrice = params.get('min') ?? ''
  const maxPrice = params.get('max') ?? ''
  const sortParam = params.get('sort')
  const sort: SortKey = isSortKey(sortParam) ? sortParam : 'price-asc'
  const filters = (params.get('f') ?? '').split(',').filter(isFilterKey)
  const onlyFavorites = filters.includes('favorites')
  const hasActive =
    filters.length > 0 || Boolean(service) || Boolean(city) || Boolean(district) || Boolean(minPrice) || Boolean(maxPrice)

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState(query)

  const token = useSessionStore((state) => state.token)
  const availableFilters: readonly FilterKey[] | undefined = token ? undefined : FILTER_OUTSIDE_AUTH
  const favoritesQuery = useFavoriteIds()
  const favorites = favoritesQuery.data ?? []
  const toggleFavoriteMutation = useToggleFavorite()
  const mode = useViewModeStore((state) => state.mode)
  const isMobile = useMediaQuery('(max-width: 639px)')
  // На телефоне всегда книжная сетка: альбомные карточки в узком экране тесны.
  const viewMode = isMobile ? 'grid' : mode
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
      { q: query, city, district, service, minPrice, maxPrice: maxPriceEffective, sort, filters, ids: onlyFavorites ? favorites : [] },
    ],
    queryFn: ({ pageParam, signal }) =>
      fetchHookers(
        {
          q: query || undefined,
          city: city || undefined,
          district: district || undefined,
          service: service || undefined,
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

  // Бесконечная прокрутка: маркер внизу списка подходит к экрану — тянем следующую страницу.
  useEffect(() => {
    const marker = loadMoreRef.current
    if (!marker || !list.hasNextPage || list.isFetchingNextPage) return
    if (typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void list.fetchNextPage()
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(marker)
    return () => observer.disconnect()
  }, [list, list.hasNextPage, list.isFetchingNextPage, list.fetchNextPage, pages.length])
  const favoritesReady = !onlyFavorites || favoritesQuery.isSuccess
  // Пустое избранное: запрос не нужен, а старые данные мешать не должны.
  const favoritesEmpty = onlyFavorites && favoritesQuery.isSuccess && favorites.length === 0
  const items = favoritesEmpty ? [] : pages.flatMap((page) => page.items)
  const total = favoritesEmpty ? 0 : (pages[0]?.total ?? 0)
  const showEmpty = items.length === 0 && favoritesReady && (list.isSuccess || favoritesEmpty)
  // Совсем пустая база: подсказки про фильтры бесполезны, нужен призыв создать анкету.
  const catalogEmpty =
    showEmpty &&
    total === 0 &&
    !query &&
    !city &&
    !district &&
    !service &&
    !minPrice &&
    !maxPrice &&
    filters.length === 0

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
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-1">
          <h1 className="text-xl font-medium tracking-tight text-content">Анкеты</h1>
          <p className="mt-0.5 text-[11px] text-content-muted tabular-nums" aria-live="polite">
            {list.isSuccess ? `Найдено ${total}` : 'Загружаем каталог'}
          </p>
        </div>

        <div className="relative min-w-[10rem] flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-content-muted"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Имя, район или город"
            aria-label="Поиск анкет"
            type="search"
            className="h-8 w-full pl-8 text-xs sm:text-xs"
          />
        </div>

        <div
          role="group"
          aria-label="Вид карточек"
          className="hidden gap-1 rounded-full bg-chip p-1 sm:flex"
        >
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
              aria-label={label}
              title={label}
              onClick={() => setMode(value)}
              className={
                mode === value
                  ? 'grid size-6 place-items-center rounded-full bg-surface-elevated text-content ring-1 ring-hairline'
                  : 'grid size-6 place-items-center rounded-full text-content-muted hover:text-content'
              }
            >
              {value === 'grid' ? (
                <LayoutGrid className="size-3.5" aria-hidden="true" />
              ) : (
                <Rows3 className="size-3.5" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
        <Button size="sm" variant="secondary" onClick={() => void list.refetch()}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Обновить
        </Button>
      </div>

      {/* Десктоп: сортировка и фильтры живут в виджетах-поповерах, на телефоне — панель ниже. */}
      <div className="mt-2 hidden flex-wrap items-center gap-2 sm:flex">
        <Popover
          label="Сортировка"
          icon={<ArrowUpDown className="size-3.5" aria-hidden="true" />}
          closeOnSelect
        >
          {(close) => (
            <div className="space-y-0.5">
              {SORT_OPTIONS.map((option) => (
                <PopoverOption
                  key={option.value}
                  active={sort === option.value}
                  onClick={() => {
                    update({ sort: option.value })
                    close()
                  }}
                >
                  {option.label}
                </PopoverOption>
              ))}
            </div>
          )}
        </Popover>

        <Popover
          label="Фильтры"
          icon={<SlidersHorizontal className="size-3.5" aria-hidden="true" />}
          count={filters.length + (service ? 1 : 0) + (minPrice || maxPrice ? 1 : 0)}
        >
          {() => (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {FILTER_OPTIONS.filter(
                  (option) => !availableFilters || availableFilters.includes(option.value),
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={filters.includes(option.value)}
                    onClick={() => toggleFilter(option.value)}
                    className={
                      filters.includes(option.value)
                        ? 'h-7 rounded-full bg-chip px-3 text-xs font-medium text-content ring-1 ring-content/15'
                        : 'h-7 rounded-full bg-chip px-3 text-xs text-content-muted hover:text-content'
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="border-t border-hairline pt-2">
                <p className="mb-1.5 flex items-center gap-1 text-[11px] tracking-wide text-content-muted uppercase">
                  <Banknote className="size-3" aria-hidden="true" />
                  Цена, ₽
                </p>
                <div className="flex gap-2">
                  <Input
                    value={minPrice}
                    onChange={(event) => update({ min: event.target.value.replace(/\D/g, '') })}
                    placeholder="от"
                    aria-label="Цена от"
                    inputMode="numeric"
                    className="h-8 text-xs sm:text-xs"
                  />
                  <Input
                    value={maxPrice}
                    onChange={(event) => update({ max: event.target.value.replace(/\D/g, '') })}
                    placeholder="до"
                    aria-label="Цена до"
                    inputMode="numeric"
                    className="h-8 text-xs sm:text-xs"
                  />
                </div>
              </div>

              <div className="border-t border-hairline pt-2">
                <p className="mb-1.5 flex items-center gap-1 text-[11px] tracking-wide text-content-muted uppercase">
                  <Tags className="size-3" aria-hidden="true" />
                  Услуга
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={service === option}
                      onClick={() => update({ service: service === option ? '' : option })}
                      className={
                        service === option
                          ? 'h-7 rounded-full bg-chip px-3 text-xs font-medium text-content ring-1 ring-content/15'
                          : 'h-7 rounded-full bg-chip px-3 text-xs text-content-muted hover:text-content'
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {hasActive && (
                <button
                  type="button"
                  onClick={() => {
                    resetAll()
                  }}
                  className="flex items-center gap-1 text-[11px] text-content-muted underline underline-offset-2 hover:text-content"
                >
                  <RotateCcw className="size-3" aria-hidden="true" />
                  Сбросить всё
                </button>
              )}
            </div>
          )}
        </Popover>

        <Popover
          label="Город и район"
          icon={<MapPin className="size-3.5" aria-hidden="true" />}
          count={(city ? 1 : 0) + (district ? 1 : 0)}
        >
          {() => (
            <div className="space-y-2">
              <div className="max-h-52 space-y-0.5 overflow-y-auto">
                <PopoverOption
                  active={!city}
                  onClick={() => update({ city: '', district: '' })}
                >
                  Все города
                </PopoverOption>
                {(list.data?.pages[0]?.cities ?? []).map((item) => (
                  <PopoverOption
                    key={item}
                    active={city === item}
                    onClick={() => update({ city: item, district: '' })}
                  >
                    {item}
                  </PopoverOption>
                ))}
              </div>

              {(!city || city === 'Москва') && (
                <div className="border-t border-hairline pt-2">
                  <p className="mb-1.5 text-[11px] tracking-wide text-content-muted uppercase">
                    Район
                  </p>
                  <div className="flex max-h-52 flex-wrap gap-1.5 overflow-y-auto">
                    {DISTRICTS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={district === item}
                        onClick={() => update({ district: district === item ? '' : item })}
                        className={
                          district === item
                            ? 'h-7 rounded-full bg-chip px-3 text-xs font-medium text-content ring-1 ring-content/15'
                            : 'h-7 rounded-full bg-chip px-3 text-xs text-content-muted hover:text-content'
                        }
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Popover>
      </div>

      <div className="mt-3">
        <MobileFilterPanel
          className="sm:hidden"
          sort={sort}
          onSortChange={(value) => update({ sort: value })}
          city={city}
          cities={list.data?.pages[0]?.cities ?? []}
          onCityChange={(value) => update({ city: value, district: '' })}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={(value) => update({ min: value })}
          onMaxPriceChange={(value) => update({ max: value })}
          activeFilters={filters}
          availableFilters={token ? undefined : FILTER_OUTSIDE_AUTH}
          onToggleFilter={toggleFilter}
          service={service}
          onServiceChange={(value) => update({ service: value })}
          onReset={resetAll}
          resultCount={total}
          count={filters.length + (service ? 1 : 0) + (minPrice || maxPrice ? 1 : 0) + (city ? 1 : 0)}
        />

        <div className="mt-4 min-w-0 sm:mt-0">
          {list.isPending && (
            <div className="mt-4">
              <span className="sr-only">Загружаем анкеты</span>
              <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <li key={index}>
                    <CardSkeleton />
                  </li>
                ))}
              </ul>
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
              <span className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-chip text-content-muted">
                {catalogEmpty ? (
                  <FilePlus2 className="size-5" aria-hidden="true" />
                ) : onlyFavorites ? (
                  <Heart className="size-5" aria-hidden="true" />
                ) : (
                  <SearchX className="size-5" aria-hidden="true" />
                )}
              </span>
              <p className="text-sm font-medium text-content">
                {catalogEmpty
                  ? 'Анкет пока нет'
                  : onlyFavorites
                    ? 'В избранном пусто'
                    : 'Под условия ничего не подошло'}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-content-muted">
                {catalogEmpty
                  ? 'База пустая — как после деплоя. Первую анкету добавляет любой авторизованный.'
                  : onlyFavorites
                    ? 'Жмите на сердечко на карточке, чтобы сохранить анкету.'
                    : 'Ослабьте фильтры или измените поиск.'}
              </p>
              {catalogEmpty ? (
                <Link
                  to="/hookers/new"
                  className="mt-4 inline-flex h-8 items-center gap-1 rounded-full bg-accent px-3 text-[13px] font-medium text-white hover:opacity-90"
                >
                  <FilePlus2 className="size-3.5" aria-hidden="true" />
                  Создать анкету
                </Link>
              ) : (
                <Button variant="secondary" size="sm" className="mt-4" onClick={resetAll}>
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Сбросить всё
                </Button>
              )}
            </div>
          )}

          {items.length > 0 && (
            <>
              <ul
                className={
                  viewMode === 'grid'
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
                      photoUrl={item.mainPhoto || item.photos[0]}
                      rating={item.rating}
                      reviewsCount={item.reviewsCount}
                      isNew={item.isNew}
                      orientation={viewMode === 'list' ? 'landscape' : 'portrait'}
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

              {/* Маркер: подходит к экрану — догружаем следующую страницу сами. */}
              <div ref={loadMoreRef} aria-hidden="true" className="h-px w-full" />

              <div className="flex flex-col items-center gap-2 py-8">
                {list.isFetchingNextPage && (
                  <span className="inline-flex items-center gap-2 text-[11px] text-content-muted">
                    <span
                      aria-hidden="true"
                      className="size-3.5 rounded-full border-2 border-brand-500 border-t-transparent motion-safe:animate-spin"
                    />
                    Загружаем ещё
                  </span>
                )}
                {list.hasNextPage && (
                  <Button
                    size="sm"
                    variant="ghost"
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

      <ScrollTopButton />
    </div>
  )
}
