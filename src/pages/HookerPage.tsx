import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Coins,
  Copy,
  CreditCard,
  Heart,
  MapPin,
  Pencil,
  Phone,
  Send,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Textarea } from '@/components/ui/Textarea'
import { Spinner } from '@/components/ui/Spinner'
import { HouseMap } from '@/features/geo/HouseMap'
import { addressLabel, metroLabel } from '@/features/geo/metro'
import { SimilarHookers } from '@/components/widgets/SimilarHookers'
import { PhotoGallery } from '@/components/widgets/PhotoGallery'
import { ReviewCard, Stars } from '@/components/widgets/ReviewCard'
import { createReview, fetchHooker, fetchReviews, type ReviewSort } from '@/features/hookers/api'
import { useSession } from '@/features/auth/store'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/api'
import { createPayment, fetchPayment, mockPay, type PaymentMethod } from '@/features/payments/api'
import { COMMISSION_CURRENCY, PUBLICATION_COMMISSION } from '@/features/hookers/schema'
import { useHistoryStore } from '@/stores/history'
import { copyText } from '@/lib/clipboard'
import { cn } from '@/lib/cn'

const money = new Intl.NumberFormat('ru-RU')

export default function HookerDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const source = location.state?.catalogUrl
  const catalogUrl = typeof source === 'string' && /^(?:\/|\/hookers|\/map)(?:\?|$)/.test(source) ? source : '/'
  const { id = '' } = useParams()
  const { token, user } = useSession()
  const favoritesQuery = useFavoriteIds()
  const favorites = favoritesQuery.data ?? []
  const toggleFavoriteMutation = useToggleFavorite()
  const pushHistory = useHistoryStore((state) => state.push)
  const [rating, setRating] = useState(5)
  const [sort, setSort] = useState<ReviewSort>('new')
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'ok' | 'fail' | false>(false)
  const queryClient = useQueryClient()
  const [publishError, setPublishError] = useState<string | null>(null)

  const pay = useMutation({
    mutationFn: (method: PaymentMethod) => createPayment(id, method),
    onSuccess: ({ paymentUrl }) => {
      if (paymentUrl) window.location.assign(paymentUrl)
      else setPublishError('Ключи FreeKassa не заданы — оплата недоступна.')
    },
    onError: (cause) => setPublishError((cause as Error).message || 'Платёж не открылся'),
  })

  // Локальная проверка сценария без ключей: подтверждаем оплату напрямую.
  const testPay = useMutation({
    mutationFn: async () => {
      const payment = await fetchPayment(id)
      if (!payment) throw new Error('Сначала создайте заявку кнопкой оплаты')
      return mockPay(payment.id)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hooker', id] })
      void queryClient.invalidateQueries({ queryKey: ['hookers'] })
    },
    onError: (cause) => setPublishError((cause as Error).message || 'Не удалось подтвердить'),
  })

  const hooker = useQuery({
    queryKey: ['hooker', id],
    queryFn: ({ signal }) => fetchHooker(id, signal),
    enabled: Boolean(id),
  })

  const reviews = useQuery({
    queryKey: ['reviews', id, sort],
    queryFn: ({ signal }) => fetchReviews(id, sort, signal),
    enabled: Boolean(id),
  })

  const addReview = useMutation({
    mutationFn: () => createReview(id, { rating, text: text.trim() }),
    onSuccess: () => {
      setText('')
      setError(null)
      void queryClient.invalidateQueries({ queryKey: ['reviews', id] })
      void queryClient.invalidateQueries({ queryKey: ['hooker', id] })
      void queryClient.invalidateQueries({ queryKey: ['hookers'] })
    },
    onError: (cause) => setError((cause as Error).message || 'Не удалось отправить отзыв'),
  })

  const viewedId = hooker.data?.id
  useEffect(() => {
    if (viewedId) pushHistory(viewedId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedId])

  useEffect(() => {
    setCopied(false)
  }, [viewedId])

  if (hooker.isPending) {
    return (
      <div className="mx-auto max-w-4xl py-10">
        <Spinner label="Загружаем анкету" />
      </div>
    )
  }

  if (hooker.isError || !hooker.data) {
    return (
      <div className="mx-auto max-w-4xl py-10 text-center">
        <p className="text-sm font-medium text-content">Анкета не найдена</p>
        <p className="mt-1 text-xs text-content-muted">Возможно, её сняли с публикации.</p>
        <Link
          to={catalogUrl}
          className="mt-4 inline-flex h-7 items-center rounded-full bg-strong px-3 text-xs font-medium text-surface"
        >
          К каталогу
        </Link>
      </div>
    )
  }

  const item = hooker.data
  const hasReviewed = Boolean(user && reviews.data?.some((review) => review.authorId === user.id))
  const favorite = favorites.includes(item.id)
  const isOwner = Boolean(user && item.ownerId === user.id)

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to={catalogUrl}
        onClick={(event) => {
          if (source === catalogUrl && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
            event.preventDefault()
            navigate(-1)
          }
        }}
        className="back-link inline-flex items-center gap-1 text-[11px] text-content-muted hover:text-content"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        {catalogUrl.startsWith('/map') ? 'К карте' : 'Каталог'}
      </Link>

      {isOwner && !item.isPublished && (
        <div className="mt-3 rounded-lg bg-mat p-4 ring-1 ring-dashed ring-hairline">
          <p className="text-sm font-medium text-content">Анкета не опубликована</p>
          <p className="mt-1 text-xs text-content-muted">
            В каталоге её не видно. Оплатите публикацию — {PUBLICATION_COMMISSION}{' '}
            {COMMISSION_CURRENCY}, и она появится у всех.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['card', 'sbp', 'crypto'] as const).map((method) => {
              const Icon = method === 'card' ? CreditCard : method === 'sbp' ? Send : Coins
              return (
                <Button
                  key={method}
                  size="sm"
                  variant="secondary"
                  disabled={pay.isPending}
                  onClick={() => {
                    setPublishError(null)
                    pay.mutate(method)
                  }}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {method === 'card' ? 'Картой' : method === 'sbp' ? 'СБП' : 'Криптой'}
                </Button>
              )
            })}
            {import.meta.env.DEV && <Button
              size="sm"
              variant="ghost"
              disabled={testPay.isPending}
              onClick={() => testPay.mutate()}
            >
              <Check className="size-3.5" aria-hidden="true" />
              Подтвердить тестом
            </Button>}
          </div>
          {publishError && <p className="mt-2 text-[11px] text-danger">{publishError}</p>}
        </div>
      )}

      <div className="detail-overview mt-3 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <PhotoGallery photos={item.photos} mainPhoto={item.mainPhoto} alt={item.name} />

        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-medium tracking-tight text-content">
                {item.name}, {item.age}
              </h1>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-content-muted">
                <MapPin className="size-3" aria-hidden="true" />
                {item.city}
                {item.district && ` · ${item.district}`} · {item.height} см
              </p>
            </div>
            <button
              type="button"
              onClick={() => token ? toggleFavoriteMutation.mutate({ id: item.id, favorite }) : navigate('/auth', { state: { from: location.pathname } })}
              aria-pressed={favorite}
              className="grid size-8 shrink-0 place-items-center rounded-full bg-chip text-sm transition-colors hover:bg-content/10"
              aria-label={favorite ? 'Убрать из избранного' : 'В избранное'}
              title={favorite ? 'Убрать из избранного' : 'В избранное'}
            >
              <Heart
                className={cn('size-4', favorite && 'fill-brand-500 text-brand-500')}
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <Stars score={Math.round(item.rating)} />
            <span className="text-[11px] text-content-muted">
              {item.reviewsCount} {item.reviewsCount === 1 ? 'отзыв' : 'отзывов'}
            </span>
          </div>

          <p className="mt-3 text-lg font-medium text-content tabular-nums">
            {money.format(item.pricePerHour)} ₽
            <span className="text-xs font-normal text-content-muted">/час</span>
          </p>

          {item.services.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {item.services.map((service) => (
                <li key={service} className="rounded-full bg-chip px-2.5 py-1 text-[11px] text-content-muted">
                  {service}
                </li>
              ))}
            </ul>
          )}

          {item.about && <p className="mt-4 text-[13px] whitespace-pre-line text-content">{item.about}</p>}

          {/* Контакт — главное действие страницы, поэтому крупно и отдельно от вторичного. */}
          <div className="mt-4 rounded-lg bg-mat p-3 ring-1 ring-hairline">
            <p className="text-[11px] tracking-wide text-content-muted uppercase">Связаться</p>
            <div className="mt-2 flex items-center gap-2">
              <a
                href={`tel:${item.phone.replace(/[^+\d]/g, '')}`}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-white tabular-nums hover:opacity-90"
              >
                <Phone className="size-4" aria-hidden="true" />
                {item.phone}
              </a>
              <button
                type="button"
                onClick={() => {
                  void copyText(item.phone).then((ok) => {
                    setCopied(ok ? 'ok' : 'fail')
                    if (ok) setTimeout(() => setCopied(false), 2000)
                  })
                }}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-chip text-content hover:bg-content/10"
                aria-label={copied === 'ok' ? 'Телефон скопирован' : 'Скопировать телефон'}
                title="Скопировать телефон"
              >
                {copied === 'ok' ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="mt-1.5 h-4 text-[11px] text-content-muted" aria-live="polite">
              {copied === 'ok' ? 'Скопировано в буфер' : copied === 'fail' ? 'Не удалось — выделите номер вручную' : ''}
            </p>
          </div>

          {isOwner && (
            <Link
              to={`/hookers/${item.id}/edit`}
              className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full bg-chip px-3 text-[13px] text-content hover:bg-content/10"
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              Редактировать анкету
            </Link>
          )}
        </div>
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="font-medium">Адрес встречи</h2>
        {item.address ? <>
          <p>{addressLabel(item.address)}</p>
          {item.address.metroIds.length > 0 && <p className="text-sm text-content-muted">Метро рядом · {metroLabel(item.address.metroIds)}</p>}
          <HouseMap items={[{id:item.id,name:item.name,address:item.address}]}/>
          <a className="underline" target="_blank" rel="noreferrer" href={`https://yandex.ru/maps/?pt=${item.address.lon},${item.address.lat}&z=17`}>Открыть дом в Яндекс Картах</a>
        </> : <p className="text-content-muted">{item.district && item.district+' · '}Автор пока не указал дом.</p>}
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[11px] tracking-wide text-content-muted uppercase">
            Отзывы ({reviews.data?.length ?? 0})
          </h2>

          <div role="group" aria-label="Сортировка отзывов" className="flex gap-1 rounded-full bg-chip p-1">
            {(
              [
                ['new', 'Новые'],
                ['old', 'Старые'],
                ['worst', 'Худшие'],
                ['best', 'Лучшие'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={sort === value}
                onClick={() => setSort(value)}
                className={
                  sort === value
                    ? 'h-6 rounded-full bg-surface-elevated px-2.5 text-[11px] font-medium text-content ring-1 ring-hairline'
                    : 'h-6 rounded-full px-2.5 text-[11px] text-content-muted hover:text-content'
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isOwner ? (
          <p className="mt-3 rounded-lg bg-mat p-4 text-xs text-content-muted">
            Это ваша анкета — отзыв оставляют клиенты, поэтому оценивать себя нельзя.
          </p>
        ) : token && !hasReviewed ? (
          <form
            className="mt-3 space-y-2 rounded-lg bg-surface-elevated p-4 ring-1 ring-hairline"
            onSubmit={(event) => {
              event.preventDefault()
              if (text.trim().length < 10) {
                setError('Текст: минимум 10 символов')
                return
              }
              addReview.mutate()
            }}
          >
            <Field label="Ваша оценка" htmlFor="rating" required>
              <div className="flex gap-1" id="rating" role="radiogroup" aria-label="Ваша оценка">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} из 5`}
                    onClick={() => setRating(value)}
                    className={cn('leading-none', value <= rating ? 'text-rating' : 'text-line')}
                  >
                    <Star className={cn('size-5', value <= rating && 'fill-rating')} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Текст отзыва" htmlFor="text" required error={error ?? undefined}>
              <Textarea
                id="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={3}
                placeholder="Как прошла встреча, что важно знать другим"
                invalid={Boolean(error)}
              />
            </Field>
            <Button type="submit" size="sm" isLoading={addReview.isPending}>
              <Send className="size-3.5" aria-hidden="true" />
              Отправить отзыв
            </Button>
          </form>
        ) : hasReviewed ? null : (
          <p className="mt-3 rounded-lg bg-mat p-4 text-xs text-content-muted">
            Отзыв может оставить только вошедший.{' '}
            <Link to="/auth" className="text-content underline underline-offset-2">
              Войти
            </Link>
          </p>
        )}

        <div className="mt-3 space-y-2">
          {reviews.data
            ?.filter((review) => review.authorId === user?.id)
            .map((review) => (
              <div key={review.id} className="relative">
                <span className="absolute -top-1.5 left-3 z-10 rounded-full bg-strong px-2 py-0.5 text-[10px] font-medium text-surface">
                  ваш отзыв
                </span>
                <ReviewCard
                  author={review.author}
                  rating={review.rating}
                  text={review.text}
                  createdAt={review.createdAt}
                  className="ring-content/30"
                />
              </div>
            ))}

          {reviews.data
            ?.filter((review) => review.authorId !== user?.id)
            .map((review) => (
              <ReviewCard
                key={review.id}
                author={review.author}
                rating={review.rating}
                text={review.text}
                createdAt={review.createdAt}
              />
            ))}
          {reviews.isSuccess && reviews.data.length === 0 && (
            <p className="text-xs text-content-muted">Пока ни одного отзыва.</p>
          )}
        </div>
      </section>

      <SimilarHookers id={item.id} city={item.city} pricePerHour={item.pricePerHour} />
    </div>
  )
}
