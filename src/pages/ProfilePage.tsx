import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { deleteHooker, fetchHookers, fetchMyHookers } from '@/features/hookers/api'
import { fetchMyReviews } from '@/features/auth/api'
import { useHistoryStore } from '@/stores/history'
import { Stars } from '@/components/widgets/ReviewCard'
import { useSessionStore } from '@/features/auth/store'

const money = new Intl.NumberFormat('ru-RU')

export default function ProfilePage() {
  const { user, clear } = useSessionStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const mine = useQuery({ queryKey: ['my-hookers'], queryFn: ({ signal }) => fetchMyHookers(signal) })
  const historyIds = useHistoryStore((state) => state.entries).map((entry) => entry.id)
  const history = useQuery({
    queryKey: ['history-local', historyIds],
    queryFn: ({ signal }) => fetchHookers({ ids: historyIds, limit: 20 }, signal),
    enabled: historyIds.length > 0,
  })
  const myReviews = useQuery({ queryKey: ['my-reviews'], queryFn: ({ signal }) => fetchMyReviews(signal) })

  const remove = useMutation({
    mutationFn: (id: string) => deleteHooker(id),
    onSuccess: () => {
      setConfirmId(null)
      setRemoveError(null)
      void queryClient.invalidateQueries({ queryKey: ['my-hookers'] })
      void queryClient.invalidateQueries({ queryKey: ['hookers'] })
    },
    onError: (cause) => setRemoveError((cause as Error).message || 'Не удалось удалить анкету'),
  })

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-content">Мой профиль</h1>
          <p className="mt-0.5 text-xs text-content-muted">
            {user?.name} · {user?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/profile/edit"
            className="inline-flex h-7 items-center rounded-full bg-chip px-3 text-xs text-content hover:bg-content/10"
          >
            Редактировать профиль
          </Link>
          <Link
            to="/hookers/new"
            className="inline-flex h-7 items-center rounded-full bg-strong px-3 text-xs font-medium text-surface hover:opacity-90"
          >
            Создать анкету
          </Link>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              clear()
              navigate('/auth', { replace: true })
            }}
          >
            Выйти
          </Button>
        </div>
      </div>

      <h2 className="mt-6 text-[11px] tracking-wide text-content-muted uppercase">
        Мои анкеты{mine.data ? ` (${mine.data.length})` : ''}
      </h2>

      {removeError && (
        <p role="alert" className="mt-2 rounded-md bg-danger/10 p-2 text-xs text-danger">
          {removeError}
        </p>
      )}

      {mine.isPending && (
        <div className="mt-3">
          <Spinner label="Загружаем анкеты" />
        </div>
      )}

      {mine.isError && (
        <p className="mt-3 text-xs text-content-muted">Анкеты не загрузились — обновите страницу.</p>
      )}

      {mine.isSuccess && mine.data.length === 0 && (
        <div className="mt-3 rounded-lg bg-mat p-6 text-center ring-1 ring-dashed ring-hairline">
          <p className="text-sm font-medium text-content">Анкет нет</p>
          <p className="mt-1 text-xs text-content-muted">Опубликуйте первую — она появится в каталоге.</p>
        </div>
      )}

      {mine.isSuccess && mine.data.length > 0 && (
        <ul className="mt-3 divide-y divide-hairline rounded-lg bg-surface-elevated ring-1 ring-hairline">
          {mine.data.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <Link to={`/hookers/${item.id}`} className="truncate text-[13px] font-medium text-content hover:underline">
                  {item.name}, {item.age}
                </Link>
                <p className="text-[11px] text-content-muted tabular-nums">
                  {item.city} · {money.format(item.pricePerHour)} ₽ · {item.reviewsCount} отз.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {confirmId === item.id ? (
                  <>
                    <span className="text-[11px] text-content-muted">Снять?</span>
                    <Button
                      size="sm"
                      variant="danger"
                      isLoading={remove.isPending}
                      onClick={() => remove.mutate(item.id)}
                    >
                      Удалить
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>
                      Оставить
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      to={`/hookers/${item.id}/edit`}
                      className="inline-flex h-7 items-center rounded-full bg-chip px-2.5 text-xs text-content hover:bg-content/10"
                    >
                      Изменить
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmId(item.id)}>
                      Удалить
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 text-[11px] tracking-wide text-content-muted uppercase">
        История просмотров
      </h2>
      {historyIds.length === 0 && (
        <p className="mt-2 text-xs text-content-muted">Пока пусто — открытые анкеты появятся здесь.</p>
      )}
      {history.isError && (
        <p className="mt-2 text-xs text-content-muted">Историю не удалось подгрузить.</p>
      )}
      {history.isSuccess && history.data.items.length > 0 && (
        <ul className="mt-2 divide-y divide-hairline rounded-lg bg-surface-elevated ring-1 ring-hairline">
          {history.data.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 p-2.5">
              <Link to={`/hookers/${item.id}`} className="truncate text-xs text-content hover:underline">
                {item.name}, {item.age} · {item.city}
              </Link>
              <span className="shrink-0 text-[11px] text-content-muted tabular-nums">
                {money.format(item.pricePerHour)} ₽
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 text-[11px] tracking-wide text-content-muted uppercase">Мои отзывы</h2>
      {myReviews.isSuccess && myReviews.data.length === 0 && (
        <p className="mt-2 text-xs text-content-muted">Вы ещё не писали отзывов.</p>
      )}
      {myReviews.isSuccess && myReviews.data.length > 0 && (
        <ul className="mt-2 space-y-2">
          {myReviews.data.map((review) => (
            <li key={review.id} className="rounded-lg bg-surface-elevated p-3 ring-1 ring-hairline">
              <div className="flex items-center justify-between gap-2">
                <Link to={`/hookers/${review.hookerId}`} className="text-xs font-medium text-content hover:underline">
                  {review.hookerName}
                </Link>
                <Stars score={review.rating} />
              </div>
              <p className="mt-1.5 text-xs text-content-muted">{review.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
