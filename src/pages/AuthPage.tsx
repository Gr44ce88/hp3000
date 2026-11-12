import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { login, register as registerUser } from '@/features/auth/api'
import { useSessionStore } from '@/features/auth/store'
import type { SessionUser } from '@/features/auth/api'
import {
  loginSchema,
  registerSchema,
  type LoginValues,
  type RegisterValues,
} from '@/features/auth/schemas'
import { cn } from '@/lib/cn'

type Mode = 'login' | 'register'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [error, setError] = useState<string | null>(null)
  const setSession = useSessionStore((state) => state.setSession)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/profile'

  const done = (token: string, user: SessionUser) => {
    setSession(token, user)
    navigate(from, { replace: true })
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-medium tracking-tight text-content">
        {mode === 'login' ? 'Вход' : 'Регистрация'}
      </h1>
      <p className="mt-1 text-xs text-content-muted">
        {mode === 'login'
          ? 'Войдите, чтобы управлять анкетой и писать отзывы.'
          : 'Аккаунт нужен, чтобы размещать анкеты и отвечать на отзывы.'}
      </p>

      <div role="tablist" aria-label="Режим формы" className="mt-4 flex gap-1 rounded-full bg-chip p-1">
        {(['login', 'register'] as Mode[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            type="button"
            aria-selected={mode === tab}
            onClick={() => {
              setMode(tab)
              setError(null)
            }}
            className={cn(
              'h-6 flex-1 rounded-full text-xs transition-colors',
              mode === tab ? 'bg-surface-elevated font-medium text-content ring-1 ring-hairline' : 'text-content-muted hover:text-content',
            )}
          >
            {tab === 'login' ? 'Вход' : 'Регистрация'}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {error && (
          <p role="alert" className="mb-3 rounded-md bg-danger/10 p-3 text-xs text-danger">
            {error}
          </p>
        )}
        {mode === 'login' ? (
          <LoginForm onDone={done} onError={setError} />
        ) : (
          <RegisterForm onDone={done} onError={setError} />
        )}
      </div>

      <Link to="/" className="mt-6 inline-block text-[11px] text-content-muted hover:text-content">
        ← На главную
      </Link>
    </div>
  )
}

type DoneHandler = (token: string, user: SessionUser) => void

function LoginForm({ onDone, onError }: { onDone: DoneHandler; onError: (message: string) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), mode: 'onTouched' })

  const signIn = useMutation({
    mutationFn: (values: LoginValues) => login(values),
    onSuccess: (data) => onDone(data.token, data.user),
    onError: (cause) => onError((cause as Error).message || 'Не удалось войти'),
  })

  return (
    <form noValidate className="space-y-3" onSubmit={handleSubmit((values) => signIn.mutate(values))}>
      <Field label="E-mail" htmlFor="login-email" required error={errors.email?.message}>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          invalid={Boolean(errors.email)}
          {...register('email')}
        />
      </Field>
      <Field label="Пароль" htmlFor="login-password" required error={errors.password?.message}>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          invalid={Boolean(errors.password)}
          {...register('password')}
        />
      </Field>
      <Button type="submit" className="w-full" isLoading={signIn.isPending}>
        Войти
      </Button>
    </form>
  )
}

function RegisterForm({ onDone, onError }: { onDone: DoneHandler; onError: (message: string) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), mode: 'onTouched' })

  const signUp = useMutation({
    mutationFn: (values: RegisterValues) =>
      registerUser({ name: values.name, email: values.email, password: values.password }),
    onSuccess: (data) => onDone(data.token, data.user),
    onError: (cause) => onError((cause as Error).message || 'Не удалось зарегистрироваться'),
  })

  return (
    <form noValidate className="space-y-3" onSubmit={handleSubmit((values) => signUp.mutate(values))}>
      <Field label="Имя" htmlFor="register-name" required error={errors.name?.message}>
        <Input id="register-name" autoComplete="nickname" placeholder="Как к вам обращаться" invalid={Boolean(errors.name)} {...register('name')} />
      </Field>
      <Field label="E-mail" htmlFor="register-email" required error={errors.email?.message}>
        <Input id="register-email" type="email" autoComplete="email" placeholder="you@example.com" invalid={Boolean(errors.email)} {...register('email')} />
      </Field>
      <Field label="Пароль" htmlFor="register-password" required hint="Минимум 8 символов" error={errors.password?.message}>
        <Input id="register-password" type="password" autoComplete="new-password" placeholder="••••••••" invalid={Boolean(errors.password)} {...register('password')} />
      </Field>
      <Field label="Повтор пароля" htmlFor="register-confirm" required error={errors.confirm?.message}>
        <Input id="register-confirm" type="password" autoComplete="new-password" placeholder="••••••••" invalid={Boolean(errors.confirm)} {...register('confirm')} />
      </Field>
      <Button type="submit" className="w-full" isLoading={signUp.isPending}>
        Зарегистрироваться
      </Button>
    </form>
  )
}
