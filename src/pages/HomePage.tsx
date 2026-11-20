import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useLocation, Link } from 'react-router-dom'
import {
  Check,
  Copy,
  FilePlus2,
  Heart,
  LayoutGrid,
  MapPin,
  RefreshCw,
  RotateCcw,
  Rows3,
  Search,
  SearchX,
} from 'lucide-react'
import { copyText } from '@/lib/clipboard'
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { HookerCard } from '@/components/widgets/HookerCard'
import { MobileFilterPanel } from '@/components/widgets/MobileFilterPanel'
import { CardSkeleton } from '@/components/widgets/CardSkeleton'
import { ScrollTopButton } from '@/components/widgets/ScrollTopButton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

import { fetchDistrictStats, fetchHookers } from '@/features/hookers/api'
import { DISTRICT_COORDS } from '@/features/hookers/coords'
import {
  FILTER_OPTIONS,
  SORT_OPTIONS,
  type FilterKey,
  type SortKey,
} from '@/features/hookers/sorting'
import { useSessionStore } from '@/features/auth/store'
import { useMediaQuery } from '@/hooks/useMediaQuery'
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
  const location = useLocation()
  const [copyStatus, setCopyStatus] = useState('')
  const stats = useQuery({
    queryKey: ['stats', 'districts'],
    queryFn: ({ signal }) => fetchDistrictStats(signal),
    staleTime: 60_000,
  })

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
    filters.length > 0 ||
    Boolean(service) ||
    Boolean(city) ||
    Boolean(district) ||
    Boolean(minPrice) ||
    Boolean(maxPrice)

  const districts = stats.data
    ? stats.data.filter((row) => !city || row.city === city).map((row) => row.district)
    : DISTRICTS
  const districtOptions = [
    ...new Set([...districts, ...(district ? [district] : [])]),
  ].sort((a, b) => a.localeCompare(b, 'ru'))
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  const token = useSessionStore((state) => state.token)
  const availableFilters: readonly FilterKey[] | undefined = token
    ? undefined
    : FILTER_OUTSIDE_AUTH
  const favoritesQuery = useFavoriteIds()
  const favorites = favoritesQuery.data ?? []
  const toggleFavoriteMutation = useToggleFavorite()
  const mode = useViewModeStore((state) => state.mode)
  const isMobile = useMediaQuery('(max-width: 639px)')
  // На телефоне всегда книжная сетка: альбомные карточки в узком экране тесны.
  const viewMode = isMobile ? 'grid' : mode
  const setMode = useViewModeStore((state) => state.setMode)

  const update = (patch: Record<string, string | null>) => {
    setCopyStatus('')
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    setParams(next, { replace: true })
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => clearTimeout(timer)
  }, [query])

  const maxPriceEffective = filters.includes('up-to-3000')
    ? String(Math.min(Number(maxPrice) || CHEAP_LIMIT, CHEAP_LIMIT))
    : maxPrice

  const list = useInfiniteQuery({
    queryKey: [
      'hookers',
      {
        q: debouncedQuery,
        city,
        district,
        service,
        minPrice,
        maxPrice: maxPriceEffective,
        sort,
        filters,
        ids: onlyFavorites ? favorites : [],
      },
    ],
    queryFn: ({ pageParam, signal }) =>
      fetchHookers(
        {
          q: debouncedQuery || undefined,
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
  const favoritesEmpty =
    onlyFavorites && favoritesQuery.isSuccess && favorites.length === 0
  const items = favoritesEmpty ? [] : pages.flatMap((page) => page.items)
  const total = favoritesEmpty ? 0 : (pages[0]?.total ?? 0)
  const showEmpty =
    items.length === 0 && favoritesReady && (list.isSuccess || favoritesEmpty)
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
    setCopyStatus('')
    setParams(new URLSearchParams(), { replace: true })
  }

  return (
    <div className="catalog mx-auto max-w-6xl">
      <section className="catalog-mast">
        <div className="catalog-place">
          <MapPin size={15} aria-hidden="true" /> Москва и область
        </div>
        <h1>Каталог анкет</h1>
        <Link to="/map" className="map-link">
          Смотреть на карте
        </Link>
      </section>

      <section className="finder" aria-label="Поиск по каталогу">
        <label className="finder-search">
          <span>Поиск</span>
          <span className="field-icon">
            <Search size={16} aria-hidden="true" />
            <Input
              type="search"
              aria-label="Поиск анкет"
              placeholder="Имя, район или город"
              value={query}
              onChange={(event) => update({ q: event.target.value })}
              enterKeyHint="search"
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur()
              }}
            />
          </span>
        </label>
        <label>
          <span>Район</span>
          <select
            aria-label="Район"
            value={district}
            onChange={(event) => update({ district: event.target.value })}
          >
            <option value="">Все районы</option>
            {districtOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Бюджет за час, ₽</span>
          <Input
            value={maxPrice}
            inputMode="numeric"
            placeholder="Без ограничения"
            aria-label="Максимальный бюджет"
            enterKeyHint="done"
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
            onChange={(event) => update({ max: event.target.value.replace(/\D/g, '') })}
          />
        </label>
      </section>

      <div className="mt-3">
        <MobileFilterPanel
          className="advanced-panel"
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
          availableFilters={availableFilters}
          onToggleFilter={toggleFilter}
          service={service}
          onServiceChange={(value) => update({ service: value })}
          onReset={resetAll}
          resultCount={total}
          count={
            filters.length +
            (service ? 1 : 0) +
            (minPrice || maxPrice ? 1 : 0) +
            (city ? 1 : 0)
          }
        />

        <div className="results-bar">
          <div>
            <h2>Анкеты</h2>
            <p aria-live="polite">
              {list.isSuccess ? `Найдено ${total}` : 'Загружаем каталог'}
            </p>
          </div>
          <div className="result-actions">
            {(hasActive || query) && (
              <button type="button" onClick={resetAll}>
                <RotateCcw size={16} /> Сбросить
              </button>
            )}
            <button
              type="button"
              onClick={async () =>
                setCopyStatus(
                  (await copyText(window.location.href))
                    ? 'Скопировано'
                    : 'Скопируйте адрес в браузере',
                )
              }
            >
              {copyStatus === 'Скопировано' ? <Check size={16} /> : <Copy size={16} />}{' '}
              <span>{copyStatus || 'Ссылка'}</span>
            </button>
            <div className="hidden sm:flex" role="group" aria-label="Вид карточек">
              {(
                [
                  ['grid', 'Книжная', LayoutGrid],
                  ['list', 'Альбомная', Rows3],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  aria-label={label}
                  title={label}
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                >
                  <Icon size={17} />
                </button>
              ))}
            </div>
          </div>
        </div>
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
            <div className="bg-surface-elevated ring-hairline mt-2 rounded-lg p-4 text-xs ring-1">
              <p className="text-content text-[13px] font-medium">
                {[502, 504].includes((list.error as { status?: number }).status ?? 0)
                  ? 'Сервер не отвечает.'
                  : 'Не удалось загрузить анкеты.'}
              </p>
              <p className="text-content-muted mt-1">
                Проверьте соединение и повторите запрос.
              </p>
              <Button variant="secondary" onClick={() => void list.refetch()}>
                <RefreshCw size={16} />
                Обновить
              </Button>
            </div>
          )}

          {showEmpty && (
            <div className="bg-mat ring-dashed ring-hairline rounded-lg p-8 text-center ring-1">
              <span className="bg-chip text-content-muted mx-auto mb-3 grid size-10 place-items-center rounded-full">
                {catalogEmpty ? (
                  <FilePlus2 className="size-5" aria-hidden="true" />
                ) : onlyFavorites ? (
                  <Heart className="size-5" aria-hidden="true" />
                ) : (
                  <SearchX className="size-5" aria-hidden="true" />
                )}
              </span>
              <p className="text-content text-sm font-medium">
                {catalogEmpty
                  ? 'Анкет пока нет'
                  : onlyFavorites
                    ? 'В избранном пусто'
                    : 'Под условия ничего не подошло'}
              </p>
              <p className="text-content-muted mx-auto mt-1 max-w-sm text-xs">
                {catalogEmpty
                  ? 'База пустая — как после деплоя. Первую анкету добавляет любой авторизованный.'
                  : onlyFavorites
                    ? 'Жмите на сердечко на карточке, чтобы сохранить анкету.'
                    : 'Ослабьте фильтры или измените поиск.'}
              </p>
              {catalogEmpty ? (
                <Link
                  to="/hookers/new"
                  className="bg-accent mt-4 inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-medium text-white hover:opacity-90"
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
                    ? 'grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4'
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
                      district={item.district}
                      catalogUrl={location.pathname + location.search}
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
                          ? (id) =>
                              toggleFavoriteMutation.mutate({
                                id,
                                favorite: favorites.includes(id),
                              })
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
                  <span className="text-content-muted inline-flex items-center gap-2 text-[11px]">
                    <span
                      aria-hidden="true"
                      className="border-brand-500 size-3.5 rounded-full border-2 border-t-transparent motion-safe:animate-spin"
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
                <span className="text-content-muted text-[11px] tabular-nums">
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
