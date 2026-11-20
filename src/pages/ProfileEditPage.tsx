import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Camera, Loader2, Save, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { updateMe } from '@/features/auth/api'
import { uploadPhoto } from '@/features/hookers/api'
import { useSessionStore } from '@/features/auth/store'
import { profileSchema, type ProfileValues } from '@/features/auth/schemas'

export default function ProfileEditPage() {
  const { user, setUser } = useSessionStore()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [avatar, setAvatar] = useState(user?.avatarUrl ?? '')
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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
    mutationFn: (values: ProfileValues) => updateMe({ ...values, avatarUrl: avatar }),
    onSuccess: (updated) => {
      setUser(updated)
      navigate('/profile', { replace: true })
    },
    onError: (cause) => setError((cause as Error).message || 'Не удалось сохранить'),
  })

  const addPhoto = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setAvatarError(null)
    setUploading(true)
    try {
      setAvatar(await uploadPhoto(file))
    } catch (cause) {
      setAvatarError((cause as Error).message || 'Фото не загрузилось')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link
        to="/profile"
        className="inline-flex items-center gap-1 text-[11px] text-content-muted hover:text-content"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        Профиль
      </Link>
      <h1 className="mt-2 flex items-center gap-2 text-xl font-medium tracking-tight text-content">
        <Camera className="size-5 text-brand-600" aria-hidden="true" />
        Редактирование профиля
      </h1>

      <div className="mt-4 flex items-center gap-3">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-mat text-lg font-medium text-content-muted">
          {avatar ? (
            <img src={avatar} alt="Аватар" className="size-full object-cover" />
          ) : (
            (user?.name ?? '?').slice(0, 1).toUpperCase()
          )}
        </span>
        <div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                void addPhoto(event.target.files)
                event.target.value = ''
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Camera className="size-3.5" aria-hidden="true" />
              )}
              {avatar ? 'Заменить фото' : 'Загрузить фото'}
            </Button>
            {avatar && (
              <Button size="sm" variant="ghost" type="button" onClick={() => setAvatar('')}>
                <Trash2 className="size-3.5" aria-hidden="true" />
                Удалить
              </Button>
            )}
          </div>
          <p className="mt-1 text-[11px] text-content-muted">
            JPEG, PNG или WebP до 2 МБ. Квадратное фото смотрится лучше.
          </p>
          {avatarError && <p className="mt-1 text-[11px] text-danger">{avatarError}</p>}
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
            <Save className="size-4" aria-hidden="true" />
            Сохранить
          </Button>
          <Link
            to="/profile"
            className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13px] text-content-muted hover:text-content"
          >
            <X className="size-3.5" aria-hidden="true" />
            Отмена
          </Link>
        </div>
      </form>
    </div>
  )
}
