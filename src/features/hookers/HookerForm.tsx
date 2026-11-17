import { Link } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Field, Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { CITIES } from '@/features/hookers/cities'
import type { ListingPayload } from '@/features/hookers/api'
import {
  COMMISSION_CURRENCY,
  listingSchema,
  PAYMENT_METHODS,
  PUBLICATION_COMMISSION,
  type ListingInput,
  type ListingValues,
  type PaymentMethod,
} from '@/features/hookers/schema'
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
    formState: { errors },
  } = useForm<ListingInput, unknown, ListingValues>({
    resolver: zodResolver(listingSchema),
    mode: 'onTouched',
    defaultValues: { paymentMethod: 'card', ...defaultValues },
  })

  const paymentMethod = useWatch({ control, name: 'paymentMethod' })
  const about = useWatch({ control, name: 'about' }) ?? ''

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

      <Field label="Услуги" htmlFor="services" hint="Через запятую" error={errors.services?.message}>
        <Input id="services" placeholder="Классика, массаж, GFE" {...register('services')} />
      </Field>

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
          {submitLabel}
        </Button>
        <Link
          to="/hookers"
          className="inline-flex h-8 items-center rounded-full px-3 text-[13px] text-content-muted hover:text-content"
        >
          Отмена
        </Link>
      </div>
    </form>
  )
}
