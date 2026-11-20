import { useLayoutEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import {
  Flame,
  Heart,
  LayoutGrid,
  LogIn,
  Moon,
  Plus,
  MapPin,
  Sun,
  UserRound,
} from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/hooks/useTheme'
import { ProfileChip } from '@/components/widgets/ProfileChip'
import { useSessionStore } from '@/features/auth/store'
import { cn } from '@/lib/cn'
import { titleFor } from '@/app/titles'

const YEAR = new Date().getFullYear()

const navItems = [
  { to: '/', label: 'Анкеты', icon: LayoutGrid, end: true },
  { to: '/map', label: 'Карта', icon: MapPin },
  { to: '/favorites', label: 'Избранное', icon: Heart },
] as const

export function AppLayout() {
  const { isDark, toggle } = useTheme()
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const lastPath = useRef<string | null>(null)
  const user = useSessionStore((state) => state.user)
  const clear = useSessionStore((state) => state.clear)
  const navigate = useNavigate()
  const mainRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    if (navigationType !== 'POP') window.scrollTo(0, 0)
    const title = titleFor(pathname)
    document.title = title ? `${title} · hp3000` : 'Страница не найдена · hp3000'
    mainRef.current?.focus({preventScroll: true})
  }, [pathname, navigationType])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-20 focus:rounded-md focus:bg-brand-600 focus:px-3 focus:py-1.5 focus:text-sm focus:text-white"
      >
        К содержанию
      </a>

      <header className="app-header sticky top-0 z-30 border-b border-hairline bg-surface/85 backdrop-blur">
        <div className="header-layout mx-auto max-w-6xl px-3 sm:px-4">
          <NavLink
            to="/"
            className="flex shrink-0 items-center gap-2 font-semibold text-content"
          >
            <span className="wordmark">hp<span>3000</span></span>
          </NavLink>

          <nav aria-label="Основная навигация" className="main-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : undefined}
                aria-label={item.label}
                title={item.label}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-content-muted transition-colors hover:text-content',
                    isActive && 'bg-chip font-medium text-content hover:text-content',
                  )
                }
              >
                <item.icon className="size-3.5" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="header-actions relative z-40 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle}
              aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
              title={isDark ? 'Светлая тема' : 'Тёмная тема'}
            >
              {isDark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
            </Button>

            <Link
              to="/hookers/new"
              aria-label="Создать анкету"
              title="Создать анкету"
              className="inline-flex h-7 items-center gap-1 rounded-full bg-accent px-3 text-xs font-medium whitespace-nowrap text-white transition-opacity hover:opacity-90"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Создать анкету</span>
            </Link>

            {user ? (
              <ProfileChip
                variant="own"
                name={user.name}
                avatarUrl={user.avatarUrl}
                onLogout={() => {
                  clear()
                  navigate('/auth', { replace: true })
                }}
              />
            ) : (
              <Link to="/auth" className="signin">Войти</Link>
            )}

          </div>
        </div>
      </header>

      <main data-page={pathname.split('/').filter(Boolean)[0] || 'catalog'}
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
          <Link to="/" className="inline-flex items-center gap-1 hover:text-content">
            <LayoutGrid className="size-3" aria-hidden="true" />
            Анкеты
          </Link>
          <Link to="/map" className="inline-flex items-center gap-1 hover:text-content">
            <Flame className="size-3" aria-hidden="true" />
            Карта
          </Link>
          <Link to="/favorites" className="inline-flex items-center gap-1 hover:text-content">
            <Heart className="size-3" aria-hidden="true" />
            Избранное
          </Link>
          <Link to="/hookers/new" className="inline-flex items-center gap-1 hover:text-content">
            <Plus className="size-3" aria-hidden="true" />
            Создать анкету
          </Link>
          <Link
            to={user ? '/profile' : '/auth'}
            className="inline-flex items-center gap-1 hover:text-content"
          >
            {user ? (
              <>
                <UserRound className="size-3" aria-hidden="true" />
                Мой профиль
              </>
            ) : (
              <>
                <LogIn className="size-3" aria-hidden="true" />
                Войти
              </>
            )}
          </Link>
        </nav>
        <p className="mt-3 text-center text-[11px] text-content-muted">hp3000 · {YEAR}</p>
      </footer>
    </div>
  )
}
