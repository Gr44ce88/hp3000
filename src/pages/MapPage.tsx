import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { catalogFilters } from '@/features/hookers/catalogFilters'
import { CatalogReturn } from '@/features/hookers/CatalogReturn'
import { useFavoriteIds } from '@/features/favorites/api'
import { toQuery } from '@/features/hookers/api'
import { stationById } from '@/features/geo/metro'
import { apiClient } from '@/lib/api/client'
import { HouseMap, type MapListing } from '@/features/geo/HouseMap'
import { addressLabel } from '@/features/geo/metro'

export default function MapPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const favorites = useFavoriteIds()
  const { request, onlyFavorites, metro } = catalogFilters(params, favorites.data ?? [])
  const query = toQuery(request)
  const mapUrl = '/map' + location.search
  const pick = useCallback(
    (id: string) => navigate('/hookers/' + id, { state: { catalogUrl: mapUrl } }),
    [navigate, mapUrl],
  )
  const noFavorites = onlyFavorites && !request.ids?.length
  const favoritesLoading = onlyFavorites && favorites.isFetching
  const favoritesError = onlyFavorites && favorites.isError
  const summary = [
    stationById.get(metro)?.name,
    request.maxPrice && 'до ' + request.maxPrice.toLocaleString('ru-RU') + ' ₽/час',
  ]
    .filter(Boolean)
    .join(' · ')
  const listings = useQuery({
    queryKey: ['hookers', 'map', query],
    enabled: !noFavorites,
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get<{ items: MapListing[] }>(
        '/map/listings' + query,
        {
          signal,
        },
      )
      return data.items
    },
  })
  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-medium">Карта анкет</h1>
      <CatalogReturn className="inline-flex min-h-11 items-center underline">
        К списку анкет
      </CatalogReturn>
      {summary && <p>{summary}</p>}
      <p className="text-content-muted">
        Выберите дом, чтобы посмотреть анкеты по этому адресу.
      </p>
      {((listings.isPending && !noFavorites) || favoritesLoading) && (
        <p role="status">Загружаем адреса…</p>
      )}
      {(listings.isError || favoritesError) && (
        <button
          className="underline"
          onClick={() => void (favoritesError ? favorites.refetch() : listings.refetch())}
        >
          Не удалось загрузить адреса. Повторить
        </button>
      )}
      {noFavorites && !favoritesLoading && !favoritesError && (
        <p>В избранном нет анкет с адресом.</p>
      )}
      {!noFavorites &&
        listings.data &&
        (listings.data.length ? (
          <>
            <p>Анкет на карте · {listings.data.length}</p>
            <HouseMap items={listings.data} onPick={pick} />
            <ul className="grid gap-2 sm:grid-cols-2">
              {listings.data.map((item) => (
                <li key={item.id}>
                  <Link
                    className="bg-mat block rounded-lg p-3"
                    to={'/hookers/' + item.id}
                    state={{ catalogUrl: mapUrl }}
                  >
                    {item.name}
                    <span className="text-content-muted block text-sm">
                      {addressLabel(item.address)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>По этим условиям нет анкет с подтверждённым адресом дома.</p>
        ))}
    </section>
  )
}
