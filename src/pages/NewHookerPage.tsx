import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HookerForm } from '@/features/hookers/HookerForm'
import { createHooker, type ListingPayload } from '@/features/hookers/api'
import { createPayment, type PaymentMethod } from '@/features/payments/api'
import { COMMISSION_CURRENCY, PUBLICATION_COMMISSION } from '@/features/hookers/schema'

export default function NewHookerPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const publish = useMutation({
    mutationFn: async (values: ListingPayload) => {
      const item = await createHooker(values)
      // Анкета создаётся скрытой: в каталог её пускает только оплата.
      try {
        const { paymentUrl } = await createPayment(
          item.id,
          (values.paymentMethod ?? 'card') as PaymentMethod,
        )
        if (paymentUrl) window.location.assign(paymentUrl)
        else setNotice('Платёжные ключи не заданы — анкета осталась неоплаченной.')
      } catch (cause) {
        setNotice((cause as Error).message || 'Анкета создана, но платёж не открылся.')
      }
      return item
    },
    onSuccess: (item) => {
      void queryClient.invalidateQueries({ queryKey: ['hookers'] })
      void queryClient.invalidateQueries({ queryKey: ['my-hookers'] })
      navigate(`/hookers/${item.id}`, { replace: true })
    },
    onError: (cause) => setError((cause as Error).message || 'Не удалось опубликовать анкету'),
  })

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-medium tracking-tight text-content">Новая анкета</h1>
      <p className="mt-1 text-xs text-content-muted">
        Публикация платная — {PUBLICATION_COMMISSION} {COMMISSION_CURRENCY}, анкета появляется в
        каталоге после оплаты.
      </p>
      {notice && <p className="mt-2 text-xs text-content-muted">{notice}</p>}
      <div className="mt-5">
        <HookerForm
          submitLabel="Опубликовать"
          pending={publish.isPending}
          error={error}
          onSubmit={(values) => {
            setError(null)
            publish.mutate(values)
          }}
        />
      </div>
    </div>
  )
}
