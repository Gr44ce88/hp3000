import { Link } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Camera, Check, Loader2, Plus, Save, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { CITIES } from '@/features/hookers/cities'
import type { ListingPayload } from '@/features/hookers/api'
import {
  COMMISSION_CURRENCY,
  listingSchema,
  PAYMENT_METHODS,
  PHOTOS_MAX,
  PUBLICATION_COMMISSION,
  SERVICES,
  type ListingInput,
  type ListingValues,
  type PaymentMethod,
} from '@/features/hookers/schema'
import { uploadPhoto } from '@/features/hookers/api'
import { cn } from '@/lib/cn'

type Props = {
  defaultValues?: Partial<ListingInput>
  submitLabel: string
  pending?: boolean
  error?: string | null
  requiresPayment?: boolean
  onSubmit: (values: ListingPayload) => void
}

export function HookerForm({
  defaultValues,
  submitLabel,
  pending = false,
  error,
  requiresPayment = true,
  onSubmit,
}: Props) {
  const [, setSaved] = useState<ListingValues | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ListingInput, unknown, ListingValues>({
    resolver: zodResolver(listingSchema),
    mode: 'onTouched',
    defaultValues: { paymentMethod: 'card', ...defaultValues },
  })

  const paymentMethod = useWatch({ control, name: 'paymentMethod' })
  const about = useWatch({ control, name: 'about' }) ?? ''
  const photos = useWatch({ control, name: 'photos' }) ?? []
  const mainPhoto = useWatch({ control, name: 'mainPhoto' }) ?? ''
  const services = useWatch({ control, name: 'services' }) ?? []
  const [uploading, setUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const room = PHOTOS_MAX - photos.length
    if (room <= 0) {
      setPhotoError(`Больше ${PHOTOS_MAX} фото нельзя`)
      return
    }

    setPhotoError(null)
    setUploading(true)
    try {
      const next = [...photos]
      for (const file of Array.from(files).slice(0, room)) {
        if (file.size > 2 * 1024 * 1024) {
          setPhotoError('Файл больше 2 МБ')
          continue
        }
        next.push(await uploadPhoto(file))
      }
      setValue('photos', next, { shouldValidate: true })
      if (!mainPhoto && next[0]) setValue('mainPhoto', next[0])
    } catch (cause) {
      setPhotoError((cause as Error).message || 'Не удалось загрузить фото')
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (url: string) => {
    const next = photos.filter((item) => item !== url)
    setValue('photos', next, { shouldValidate: true })
    if (mainPhoto === url) setValue('mainPhoto', next[0] ?? '')
  }

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit((values) => {
        setSaved(null)
        onSubmit(values as ListingPayload)
      })}
    >
      {error && (
        <p role="alert" className="rounded-md bg-danger/10 p-3 text-xs text-danger">
          {error}
        </p>
      )}

      <Field label="Псевдоним" htmlFor="name" required error={errors.name?.message}>
        <Input
          id="name"
          placeholder="Как показывать в каталоге"
          invalid={Boolean(errors.name)}
          {...register('name')}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Возраст" htmlFor="age" required error={errors.age?.message}>
          <Input id="age" inputMode="numeric" placeholder="24" invalid={Boolean(errors.age)} {...register('age')} />
        </Field>
        <Field label="Рост, см" htmlFor="height" required error={errors.height?.message}>
          <Input id="height" inputMode="numeric" placeholder="170" invalid={Boolean(errors.height)} {...register('height')} />
        </Field>
        <Field label="Город" htmlFor="city" required error={errors.city?.message}>
          <select
            id="city"
            className="h-10 w-full rounded-md border border-line bg-surface-elevated px-2 text-base text-content sm:text-sm"
            {...register('city')}
          >
            <option value={CITIES[0]}>{CITIES[0]}</option>
            {CITIES.slice(1).map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Телефон для связи" htmlFor="phone" required hint="+7 900 000-00-00" error={errors.phone?.message}>
        <Input
          id="phone"
          type="tel"
          placeholder="+7 900 000-00-00"
          invalid={Boolean(errors.phone)}
          {...register('phone')}
        />
      </Field>

      <Field label="Регион" htmlFor="region" required error={errors.region?.message}>
        <Input
          id="region"
          placeholder="Московская область"
          invalid={Boolean(errors.region)}
          {...register('region')}
        />
      </Field>

      <Field label="Цена за час, ₽" htmlFor="pricePerHour" required error={errors.pricePerHour?.message}>
        <Input
          id="pricePerHour"
          inputMode="numeric"
          placeholder="5000"
          invalid={Boolean(errors.pricePerHour)}
          {...register('pricePerHour')}
        />
      </Field>

      <fieldset>
        <legend className="mb-1.5 block text-[11px] tracking-wide text-content-muted uppercase">
          Услуги
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {SERVICES.map((option) => {
            const active = services.includes(option)
            return (
              <button
                key={option}
                type="button"
                role="checkbox"
                aria-checked={active}
                onClick={() => {
                  // Текущий список берём из формы: несколько кликов подряд иначе перетирают друг друга.
                  const current = getValues('services') ?? []
                  setValue(
                    'services',
                    active ? current.filter((item) => item !== option) : [...current, option],
                    { shouldValidate: true },
                  )
                }}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs transition-colors',
                  active
                    ? 'bg-strong font-medium text-surface'
                    : 'bg-chip text-content-muted hover:text-content',
                )}
              >
                <span aria-hidden="true" className={cn('shrink-0', !active && 'opacity-60')}>
                  {active ? <Check className="size-3" /> : <Plus className="size-3" />}
                </span>
                {option}
              </button>
            )
          })}
        </div>
        {errors.services && <p className="mt-1 text-[11px] text-danger">{errors.services.message}</p>}
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 block text-[11px] tracking-wide text-content-muted uppercase">
          Фото · {photos.length} из {PHOTOS_MAX}
        </legend>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {photos.map((url) => {
            const isMain = mainPhoto === url
            return (
              <div key={url} className="relative overflow-hidden rounded-md bg-mat ring-1 ring-hairline">
                <img src={url} alt="" className="aspect-square w-full object-cover" />
                <div className="absolute inset-x-1 bottom-1 flex gap-1">
                  <button
                    type="button"
                    aria-pressed={isMain}
                    aria-label={isMain ? 'Главное фото' : 'Сделать главным'}
                    onClick={() => setValue('mainPhoto', url)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] backdrop-blur',
                      isMain
                        ? 'bg-white/90 font-medium text-slate-900'
                        : 'bg-black/45 text-white hover:bg-black/65',
                    )}
                  >
                    {isMain ? (
                      <>
                        <Star className="size-2.5 fill-current" aria-hidden="true" />
                        главное
                      </>
                    ) : (
                      'сделать главным'
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Удалить фото"
                    onClick={() => removePhoto(url)}
                    className="grid place-items-center rounded-full bg-black/45 px-1.5 py-0.5 text-white backdrop-blur hover:bg-black/65"
                  >
                    <X className="size-2.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )
          })}

          {photos.length < PHOTOS_MAX && (
            <label
              className={cn(
                'grid aspect-square cursor-pointer place-items-center rounded-md bg-surface text-[11px] text-content-muted ring-1 ring-dashed ring-hairline hover:text-content',
                uploading && 'opacity-60',
              )}
            >
              <span className="flex flex-col items-center gap-1">
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Camera className="size-4" aria-hidden="true" />
                )}
                {uploading ? 'Загружаем…' : 'фото'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                disabled={uploading}
                onChange={(event) => {
                  void addFiles(event.target.files)
                  event.target.value = ''
                }}
              />
            </label>
          )}
        </div>

        <p className="mt-1 text-[11px] text-content-muted">
          До {PHOTOS_MAX} файлов, JPEG/PNG/WebP, каждый до 2 МБ. Главное фото показывается в каталоге.
        </p>
        {photoError && <p className="mt-1 text-[11px] text-danger">{photoError}</p>}
      </fieldset>

      <Field
        label="Описание"
        htmlFor="about"
        hint={`${(about ?? '').length} / 255 символов`}
        error={errors.about?.message}
      >
        <Textarea
          id="about"
          rows={4}
          maxLength={255}
          placeholder="Свободный текст о себе"
          invalid={Boolean(errors.about)}
          {...register('about')}
        />
      </Field>

      {requiresPayment && (
        <fieldset className="rounded-lg bg-mat p-4 ring-1 ring-hairline">
          <legend className="px-1 text-[11px] tracking-wide text-content-muted uppercase">
            Оплата комиссии
          </legend>
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-xs text-content-muted">Публикация анкеты</p>
            <p className="text-sm font-medium text-content tabular-nums">
              {PUBLICATION_COMMISSION} {COMMISSION_CURRENCY}
            </p>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {PAYMENT_METHODS.map((method) => {
              const disabled = 'disabled' in method && method.disabled
              const active = paymentMethod === method.value
              return (
                <button
                  key={method.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={disabled}
                  onClick={() =>
                    setValue('paymentMethod', method.value as PaymentMethod, { shouldValidate: true })
                  }
                  className={cn(
                    'flex items-center justify-between rounded-md px-3 py-2 text-left text-xs transition-colors',
                    active ? 'bg-chip font-medium text-content ring-1 ring-content/15' : 'bg-surface text-content-muted hover:text-content',
                    disabled && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <span>{method.label}</span>
                  <span className="text-[11px]">{method.hint}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-content-muted">
            Заглушка: реальное списание подключим позже.
          </p>
        </fieldset>
      )}

      <div className="flex gap-2">
        <Button type="submit" isLoading={pending}>
          <Save className="size-4" aria-hidden="true" />
          {submitLabel}
        </Button>
        <Link
          to="/hookers"
          className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13px] text-content-muted hover:text-content"
        >
          <X className="size-3.5" aria-hidden="true" />
          Отмена
        </Link>
      </div>
    </form>
  )
}
