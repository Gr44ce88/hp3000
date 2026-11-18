import { useQuery } from '@tanstack/react-query'
import { HookerCard } from '@/components/widgets/HookerCard'
import { fetchHookers } from '@/features/hookers/api'

/** Ближайшая выборка в том же городе и ценовом диапазоне ±50%. */
const BAND = 0.5
const LIMIT = 4
const SHOWN = 3

export function SimilarHookers({
  id,
  city,
  pricePerHour,
}: {
  id: string
  city: string
  pricePerHour: number
}) {
  const similar = useQuery({
    queryKey: ['hookers', 'similar', id],
    queryFn: ({ signal }) =>
      fetchHookers(
        {
          city,
          minPrice: Math.max(1, Math.round(pricePerHour * (1 - BAND))),
          maxPrice: Math.round(pricePerHour * (1 + BAND)),
          sort: 'rating-desc',
          limit: LIMIT,
        },
        signal,
      ),
    staleTime: 60_000,
  })

  const items = (similar.data?.items ?? []).filter((item) => item.id !== id).slice(0, SHOWN)
  if (items.length === 0) return null

  return (
    <section className="mt-8">
      <h2 className="text-[11px] tracking-wide text-content-muted uppercase">Похожие анкеты</h2>
      <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="min-w-0">
            <HookerCard
              name={item.name}
              age={item.age}
              city={item.city}
              pricePerHour={item.pricePerHour}
              height={item.height}
              photoUrl={item.mainPhoto || item.photos[0]}
              rating={item.rating}
              reviewsCount={item.reviewsCount}
              href={`/hookers/${item.id}`}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
