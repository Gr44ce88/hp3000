import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/api/client'
import { HouseMap, type MapListing } from '@/features/geo/HouseMap'
import { addressLabel } from '@/features/geo/metro'

export default function MapPage() {
  const navigate = useNavigate()
  const pick = useCallback((id: string) => navigate('/hookers/' + id), [navigate])
  const listings = useQuery({
    queryKey: ['map', 'listings'],
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get<{ items: MapListing[] }>('/map/listings', {
        signal,
      })
      return data.items
    },
  })
  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-medium">Карта анкет</h1>
      <p className="text-content-muted">
        Выберите дом, чтобы посмотреть анкеты по этому адресу.
      </p>
      {listings.isPending && <p role="status">Загружаем адреса…</p>}
      {listings.isError && (
        <button className="underline" onClick={() => void listings.refetch()}>
          Не удалось загрузить адреса. Повторить
        </button>
      )}
      {listings.data &&
        (listings.data.length ? (
          <>
            <HouseMap items={listings.data} onPick={pick} />
            <ul className="grid gap-2 sm:grid-cols-2">
              {listings.data.map((item) => (
                <li key={item.id}>
                  <Link
                    className="bg-mat block rounded-lg p-3"
                    to={'/hookers/' + item.id}
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
          <p>Пока нет анкет с подтверждённым адресом дома.</p>
        ))}
    </section>
  )
}
