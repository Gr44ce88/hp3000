import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HookerForm } from '@/features/hookers/HookerForm'
import { fetchHooker, updateHooker, type ListingPayload } from '@/features/hookers/api'
import type { City } from '@/features/hookers/cities'
import { Spinner } from '@/components/ui/Spinner'

export default function EditHookerPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const hooker = useQuery({
    queryKey: ['hooker', id],
    queryFn: ({ signal }) => fetchHooker(id, signal),
    enabled: Boolean(id),
  })

  const update = useMutation({
    mutationFn: (values: ListingPayload) => updateHooker(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hooker', id] })
      void queryClient.invalidateQueries({ queryKey: ['hookers'] })
      void queryClient.invalidateQueries({ queryKey: ['my-hookers'] })
      navigate(`/hookers/${id}`, { replace: true })
    },
    onError: (cause) => setError((cause as Error).message || 'Не удалось сохранить'),
  })

  if (hooker.isPending) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Spinner label="Загружаем анкету" />
      </div>
    )
  }

  if (!hooker.data) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center text-sm text-content-muted">
        Анкета не найдена. <Link to="/profile" className="underline">В профиль</Link>
      </div>
    )
  }

  const item = hooker.data

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-medium tracking-tight text-content">Редактирование</h1>
      <p className="mt-1 text-xs text-content-muted">Повторная оплата не нужна.</p>
      <div className="mt-5">
        <HookerForm
          submitLabel="Сохранить"
          pending={update.isPending}
          error={error}
          requiresPayment={false}
          defaultValues={{
            name: item.name,
            age: item.age,
            height: item.height,
            city: item.city as City,
            region: item.region,
            phone: item.phone,
            pricePerHour: item.pricePerHour,
            services: item.services.join(', '),
            about: item.about,
          }}
          onSubmit={(values) => {
            setError(null)
            update.mutate(values)
          }}
        />
      </div>
    </div>
  )
}
