import { useEffect, useRef } from 'react'
import { HookerCard } from '@/components/widgets/HookerCard'
import { Button } from '@/components/ui/Button'
import { HouseMap } from '@/features/geo/HouseMap'
import {
  addressLabel,
  cardLocation,
  metroLabel,
  type HouseAddress,
} from '@/features/geo/metro'
import { PUBLICATION_COMMISSION, type ListingValues } from './schema'

export function ListingPreview({
  values,
  address,
  pending,
  error,
  onEdit,
  onConfirm,
}: {
  values: ListingValues
  address: HouseAddress
  pending: boolean
  error?: string | null
  onEdit: () => void
  onConfirm: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  const metro = metroLabel(address.metroIds)
  return (
    <section aria-labelledby="preview-heading" className="space-y-4">
      <h2
        id="preview-heading"
        ref={heading}
        tabIndex={-1}
        className="text-xl font-medium"
      >
        Предпросмотр анкеты
      </h2>
      <p className="text-content-muted text-sm">
        Проверьте карточку и публичные данные перед оплатой.
      </p>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
        <div className="max-w-56">
          <HookerCard
            {...values}
            services={values.services.join(', ')}
            district={cardLocation(values.district, address)}
            photoUrl={values.mainPhoto || values.photos[0]}
            isNew
          />
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Публичные данные</h3>
          <p>
            {values.phone}{values.telegram && ' · @'+values.telegram} · {values.height} см
          </p>
          {values.about && <p>{values.about}</p>}
          {values.services.length > 0 && <p>{values.services.join(' · ')}</p>}
          <h3 className="pt-2 font-medium">Адрес встречи</h3>
          <p>{values.showHouse ? `После публикации всем будет виден дом по адресу ${addressLabel(address)}.` : 'Только метро. Точный адрес и точка дома скрыты.'}</p>
          {metro && <p className="text-content-muted text-sm">Метро рядом · {metro}</p>}
        </div>
      </div>
      {values.showHouse && <HouseMap items={[{ id: 'preview', name: values.name, address }]} />}
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={pending} onClick={onEdit}>
          Вернуться к правке
        </Button>
        <Button isLoading={pending} onClick={onConfirm}>
          Перейти к оплате · {PUBLICATION_COMMISSION} ₽
        </Button>
      </div>
    </section>
  )
}
