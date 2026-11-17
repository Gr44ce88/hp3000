import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/hooks/useTheme'
import { ProfileChip } from '@/components/widgets/ProfileChip'
import { useSessionStore } from '@/features/auth/store'
import { cn } from '@/lib/cn'
import { titleFor } from '@/app/titles'

const YEAR = new Date().getFullYear()

const navItems = [
  { to: '/', label: 'Анкеты', end: true },
  { to: '/heatmap', label: 'Тепловая карта' },
] as const

export function AppLayout() {
  const { isDark, toggle } = useTheme()
  const { pathname } = useLocation()
  const user = useSessionStore((state) => state.user)
  const clear = useSessionStore((state) => state.clear)
  const navigate = useNavigate()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const title = titleFor(pathname)
    document.title = title ? `${title} · HookersPro3000` : 'Страница не найдена · HookersPro3000'
    mainRef.current?.focus()
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-20 focus:rounded-md focus:bg-brand-600 focus:px-3 focus:py-1.5 focus:text-sm focus:text-white"
      >
        К содержанию
      </a>

      <header className="sticky top-0 z-30 border-b border-hairline bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:h-14 sm:flex-nowrap sm:py-0">
          <div className="flex min-w-0 items-center gap-3">
            <NavLink
              to="/"
              className="flex shrink-0 items-center gap-2 font-semibold text-content"
            >
              <span className="grid size-6 place-items-center rounded-md bg-strong text-[11px] font-semibold text-surface">
                H
              </span>
              <span className="text-[13px]">HookersPro3000</span>
            </NavLink>

            <nav className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 sm:mx-0 sm:overflow-visible sm:px-0">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={'end' in item ? item.end : undefined}
                  className={({ isActive }) =>
                    cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-xs text-content-muted transition-colors hover:text-content',
                      isActive && 'bg-chip font-medium text-content hover:text-content',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="relative z-40 ml-auto flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle}
              aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
            >
              {isDark ? '☀' : '☾'}
            </Button>

            <Link
              to="/hookers/new"
              className="inline-flex h-7 items-center rounded-full bg-strong px-3 text-xs font-medium whitespace-nowrap text-surface transition-opacity hover:opacity-90"
            >
              Создать анкету
            </Link>

            {user ? (
              <ProfileChip
                variant="own"
                name={user.name}
                onLogout={() => {
                  clear()
                  navigate('/auth', { replace: true })
                }}
              />
            ) : (
              <ProfileChip variant="anonymous" />
            )}

          </div>
        </div>
      </header>

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 focus:outline-none"
      >
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      <footer className="border-t border-hairline px-4 py-5">
        <nav
          aria-label="Нижняя навигация"
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-content-muted"
        >
          <Link to="/" className="hover:text-content">
            Анкеты
          </Link>
          <Link to="/heatmap" className="hover:text-content">
            Тепловая карта
          </Link>
          <Link to="/favorites" className="hover:text-content">
            Избранное
          </Link>
          <Link to="/hookers/new" className="hover:text-content">
            Создать анкету
          </Link>
          <Link to={user ? '/profile' : '/auth'} className="hover:text-content">
            {user ? 'Мой профиль' : 'Войти'}
          </Link>
        </nav>
        <p className="mt-3 text-center text-[11px] text-content-muted">HookersPro3000 · {YEAR}</p>
      </footer>
    </div>
  )
}
