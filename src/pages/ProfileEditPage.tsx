import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { updateMe } from '@/features/auth/api'
import { useSessionStore } from '@/features/auth/store'
import { profileSchema, type ProfileValues } from '@/features/auth/schemas'

export default function ProfileEditPage() {
  const { user, setUser } = useSessionStore()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
    },
  })

  const save = useMutation({
    mutationFn: (values: ProfileValues) => updateMe(values),
    onSuccess: (updated) => {
      setUser(updated)
      navigate('/profile', { replace: true })
    },
    onError: (cause) => setError((cause as Error).message || 'Не удалось сохранить'),
  })

  return (
    <div className="mx-auto max-w-lg">
      <Link to="/profile" className="text-[11px] text-content-muted hover:text-content">
        ← Профиль
      </Link>
      <h1 className="mt-2 text-xl font-medium tracking-tight text-content">Редактирование профиля</h1>

      <div className="mt-4 flex items-center gap-3">
        <span className="grid size-14 place-items-center rounded-full bg-mat text-lg font-medium text-content-muted">
          {user?.avatarUrl ? 'фото' : (user?.name ?? '?').slice(0, 1).toUpperCase()}
        </span>
        <div>
          <Button size="sm" variant="secondary" type="button" disabled>
            Загрузить аватар
          </Button>
          <p className="mt-1 text-[11px] text-content-muted">Заглушка: загрузку подключим позже</p>
        </div>
      </div>

      <form
        noValidate
        className="mt-5 space-y-3"
        onSubmit={handleSubmit((values) => {
          setError(null)
          save.mutate(values)
        })}
      >
        {error && (
          <p role="alert" className="rounded-md bg-danger/10 p-3 text-xs text-danger">
            {error}
          </p>
        )}

        <Field label="Имя" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" autoComplete="nickname" invalid={Boolean(errors.name)} {...register('name')} />
        </Field>

        <Field label="E-mail" htmlFor="email" required error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" invalid={Boolean(errors.email)} {...register('email')} />
        </Field>

        <div className="flex gap-2">
          <Button type="submit" isLoading={save.isPending}>
            Сохранить
          </Button>
          <Link
            to="/profile"
            className="inline-flex h-8 items-center rounded-full px-3 text-[13px] text-content-muted hover:text-content"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  )
}
