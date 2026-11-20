import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Heart, LogIn } from 'lucide-react'
import { HookerCard } from '@/components/widgets/HookerCard'
import { Spinner } from '@/components/ui/Spinner'
import { fetchHookers } from '@/features/hookers/api'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/api'
import { useSessionStore } from '@/features/auth/store'

export default function FavoritesPage() {
  const token = useSessionStore((state) => state.token)
  const favoritesQuery = useFavoriteIds()
  const ids = favoritesQuery.data ?? []
  const toggleMutation = useToggleFavorite()
  const toggle = (id: string) => toggleMutation.mutate({ id, favorite: true })

  const favorites = useQuery({
    queryKey: ['favorites', 'list', ids],
    queryFn: ({ signal }) => fetchHookers({ ids, limit: 24 }, signal),
    enabled: ids.length > 0,
  })

  if (!token) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="text-xl font-medium tracking-tight text-content">Избранное</h1>
        <div className="mt-4 rounded-lg bg-mat p-8 text-center ring-1 ring-dashed ring-hairline">
          <span className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-chip text-content-muted">
            <LogIn className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-content">Нужен вход</p>
          <p className="mt-1 text-xs text-content-muted">
            Избранное хранится в аккаунте — войдите, чтобы видеть сохранённое.
          </p>
          <Link
            to="/auth" state={{ from: "/favorites" }}
            className="mt-4 inline-flex h-7 items-center gap-1 rounded-full bg-accent px-3 text-xs font-medium text-white"
          >
            <LogIn className="size-3" aria-hidden="true" />
            Войти
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-medium tracking-tight text-content">Избранное</h1>
      <p className="mt-0.5 text-[11px] text-content-muted tabular-nums">
        {favoritesQuery.isSuccess ? `${ids.length} сохранено` : 'Загружаем список'}
      </p>

      {favoritesQuery.isError && (
        <p className="mt-3 text-xs text-content-muted">Не удалось загрузить избранное.</p>
      )}

      {favoritesQuery.isSuccess && ids.length === 0 && (
        <div className="mt-4 rounded-lg bg-mat p-8 text-center ring-1 ring-dashed ring-hairline">
          <span className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-chip text-content-muted">
            <Heart className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-content">Пусто</p>
          <p className="mt-1 text-xs text-content-muted">
            Сохраняйте анкеты сердечком на карточке в каталоге.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex h-7 items-center gap-1 rounded-full bg-accent px-3 text-xs font-medium text-white"
          >
            <ArrowLeft className="size-3" aria-hidden="true" />
            В каталог
          </Link>
        </div>
      )}

      {favorites.isPending && ids.length > 0 && (
        <div className="mt-4">
          <Spinner label="Загружаем избранное" />
        </div>
      )}

      {favorites.isError && (
        <p className="mt-3 text-xs text-content-muted">Анкеты не загрузились. Обновите страницу.</p>
      )}

      {favorites.isSuccess && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {favorites.data.items.map((item) => (
            <li key={item.id} className="min-w-0">
              <HookerCard
                id={item.id}
                name={item.name}
                age={item.age}
                city={item.city}
                district={item.district}
                pricePerHour={item.pricePerHour}
                height={item.height}
                photoUrl={item.mainPhoto || item.photos[0]}
                rating={item.rating}
                reviewsCount={item.reviewsCount}
                isFavorite
                onToggleFavorite={toggle}
                href={`/hookers/${item.id}`}
              />
            </li>
          ))}
        </ul>
      )}

      {favorites.isSuccess && ids.length > favorites.data.items.length && (
        <p className="mt-3 text-[11px] text-content-muted">
          Часть сохранённых анкет снята с публикации.
        </p>
      )}
    </div>
  )
}
