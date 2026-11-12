import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HookerForm } from '@/features/hookers/HookerForm'
import { createHooker, type ListingPayload } from '@/features/hookers/api'

export default function NewHookerPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: (values: ListingPayload) => createHooker(values),
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
        Публикация платная — комиссия списывается на шаге оплаты.
      </p>
      <div className="mt-5">
        <HookerForm
          submitLabel="Опубликовать"
          pending={create.isPending}
          error={error}
          onSubmit={(values) => {
            setError(null)
            create.mutate(values)
          }}
        />
      </div>
    </div>
  )
}
