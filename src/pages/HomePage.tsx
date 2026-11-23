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
import { apiClient } from '@/lib/api/client'
import type {Alternatives} from '@/features/geo/alternatives'
import {stationById} from '@/features/geo/metro'
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { HookerCard } from '@/components/widgets/HookerCard'
import { MobileFilterPanel } from '@/components/widgets/MobileFilterPanel'
import { CardSkeleton } from '@/components/widgets/CardSkeleton'
import { ScrollTopButton } from '@/components/widgets/ScrollTopButton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

import { fetchHookers, toQuery } from '@/features/hookers/api'
import { MetroPicker } from '@/features/geo/MetroPicker'
import { cardLocation, stationDistance } from '@/features/geo/metro'
import { catalogFilters } from '@/features/hookers/catalogFilters'
import type { FilterKey } from '@/features/hookers/sorting'
import { useCatalogPosition, mapLinkProps } from '@/features/hookers/catalogNavigation'
import { useSessionStore } from '@/features/auth/store'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/api'
import { useViewModeStore } from '@/stores/viewMode'

const PAGE_SIZE = 12
const FILTER_OUTSIDE_AUTH = ['with-photo', 'up-to-3000', 'reviewed', 'center'] as const
export default function HomePage() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const [copyStatus, setCopyStatus] = useState('')
  // Всё состояние каталога живёт в адресной строке: переживает перезагрузку и шарится ссылкой.
  const favoritesQuery = useFavoriteIds()
  const favorites = favoritesQuery.data ?? []
  const {request, query, city, metro, district, service, minPrice, maxPrice, sort, filters, onlyFavorites} = catalogFilters(params,favorites)
  const hasActive =
    filters.length > 0 ||
    Boolean(service) ||
    Boolean(city) ||
    Boolean(metro) ||
    Boolean(district) ||
    Boolean(minPrice) ||
    Boolean(maxPrice)

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  const token = useSessionStore((state) => state.token)
  const availableFilters: readonly FilterKey[] | undefined = token
    ? undefined
    : FILTER_OUTSIDE_AUTH
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

  const search = {...request, q:debouncedQuery.trim() || undefined}
  const list = useInfiniteQuery({
    queryKey:['hookers',search],
    queryFn:({pageParam,signal})=>fetchHookers({...search, page:pageParam, limit:PAGE_SIZE},signal),
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
  const favoritesReady = !onlyFavorites || !token || favoritesQuery.isSuccess
  // Пустое избранное: запрос не нужен, а старые данные мешать не должны.
  const favoritesEmpty =
    onlyFavorites && (!token || favoritesQuery.isSuccess) && favorites.length === 0
  const items = favoritesEmpty ? [] : pages.flatMap((page) => page.items)
  const total = favoritesEmpty ? 0 : (pages[0]?.total ?? 0)
  useCatalogPosition(list.isSuccess || favoritesEmpty)
  const mappedTotal = favoritesEmpty ? 0 : pages[0]?.mappedTotal
  const showEmpty =
    items.length === 0 && favoritesReady && (list.isSuccess || favoritesEmpty)
  const alternatives = useQuery({
    queryKey:['hookers','alternatives',search],
    queryFn:async({signal})=>(await apiClient.get<Alternatives>('/catalog/alternatives'+toQuery(search),{signal})).data,
    enabled:showEmpty && !favoritesEmpty && Boolean(metro) && !list.isPlaceholderData && query.trim()===debouncedQuery.trim(),
  })
  const nearby=alternatives.data?.nearby
  const minimum=alternatives.data?.minimum
  // Совсем пустая база: подсказки про фильтры бесполезны, нужен призыв создать анкету.
  const catalogEmpty =
    showEmpty &&
    total === 0 &&
    !query &&
    !city &&
    !metro &&
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
        <Link {...mapLinkProps(location)} className="map-link">
          На карте{mappedTotal != null && !list.isPlaceholderData ? ' · '+mappedTotal : ''}
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
        <MetroPicker value={metro} onChange={value => update({ metro: value, district: '' })} />
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

      {district && <button className="mt-2 underline" onClick={() => update({district:null})}>Район {district} ×</button>}
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
                ) : favoritesEmpty ? (
                  <Heart className="size-5" aria-hidden="true" />
                ) : (
                  <SearchX className="size-5" aria-hidden="true" />
                )}
              </span>
              <p className="text-content text-sm font-medium">
                {catalogEmpty
                  ? 'Анкет пока нет'
                  : favoritesEmpty
                    ? 'В избранном пусто'
                    : 'Под условия ничего не подошло'}
              </p>
              <p className="text-content-muted mx-auto mt-1 max-w-sm text-xs">
                {catalogEmpty
                  ? 'База пустая — как после деплоя. Первую анкету добавляет любой авторизованный.'
                  : favoritesEmpty
                    ? 'Жмите на сердечко на карточке, чтобы сохранить анкету.'
                    : 'Ослабьте фильтры или измените поиск.'}
              </p>
                {nearby && <button className="block mx-auto my-2 min-h-11 underline" onClick={()=>update({metro:nearby.id})}>{stationById.get(nearby.id)?.name} · найдено {nearby.count} с теми же фильтрами</button>}
              {minimum && <button className="block mx-auto my-2 min-h-11 underline" onClick={()=>update({max:String(minimum),f:filters.filter(f=>f!=='up-to-3000').join(',')})}>У этой станции от {minimum.toLocaleString('ru-RU')} ₽/час</button>}
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
                      confirmedAt={item.confirmedAt} name={item.name}
                      age={item.age}
                      city={item.city}
                      district={cardLocation(item.district,item.address ?? {metroIds:item.metroIds ?? []},metro)}
                      stationDistance={stationDistance(item.address,metro) ?? (metro && item.metroIds?.includes(metro) ? 'м. '+stationById.get(metro)?.name+' · '+(item.distanceBand || 'рядом') : undefined)}
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
