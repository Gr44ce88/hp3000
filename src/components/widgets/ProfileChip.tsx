import { useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Heart, LogIn, LogOut, Pencil, UserRound } from 'lucide-react'
import { useProfileMenuStore } from '@/stores/profileMenu'
import { cn } from '@/lib/cn'

export type ProfileVariant = 'own' | 'foreign' | 'anonymous'

export type ProfileChipProps = {
  variant: ProfileVariant
  name?: string
  onLogout?: () => void
  avatarUrl?: string
  reviewsCount?: number
  registeredAt?: string
  className?: string
}

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** Профиль в шапке: при наведении на аватар раскрывается список действий под вариант. */
export function ProfileChip({
  variant,
  name,
  avatarUrl,
  reviewsCount = 0,
  registeredAt,
  onLogout,
  className,
}: ProfileChipProps) {
  const menuId = useId()
  const openId = useProfileMenuStore((state) => state.openId)
  const setOpenId = useProfileMenuStore((state) => state.setOpen)
  const open = openId === menuId
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const openMenu = () => {
    cancelClose()
    setOpenId(menuId)
  }

  const closeMenu = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpenId(null), 993)
  }

  const closeNow = () => {
    cancelClose()
    setOpenId(null)
  }

  const closeAndRestore = () => {
    closeNow()
    triggerRef.current?.focus()
  }

  const moveFocus = (direction: 1 | -1) => {
    const items = [
      ...(rootRef.current?.querySelectorAll<HTMLElement>(
        '[role="menu"] a, [role="menu"] button',
      ) ?? []),
    ]
    if (items.length === 0) return
    const current = items.findIndex((item) => item === document.activeElement)
    const next = current === -1 ? 0 : (current + direction + items.length) % items.length
    items[next]?.focus()
  }

  const label = variant === 'anonymous' ? 'Войти' : (name ?? 'Профиль')

  return (
    <div
      ref={rootRef}
      className={cn('relative z-40', className)}
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation()
          closeAndRestore()
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          if (!open) openMenu()
          moveFocus(1)
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          if (!open) openMenu()
          moveFocus(-1)
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => (open ? closeNow() : openMenu())}
        onFocus={openMenu}
        className="flex h-8 items-center gap-1.5 rounded-full bg-chip pr-2.5 pl-1 text-content transition-colors hover:bg-content/10"
      >
        <Avatar variant={variant} name={name} avatarUrl={avatarUrl} />
        <span className="max-w-32 truncate text-xs">{label}</span>
        <span
          aria-hidden="true"
          className={cn('text-content-muted transition-transform', open && 'rotate-180')}
        >
          <ChevronDown className="size-3.5" />
        </span>
      </button>

      <div
        id={menuId}
        role="menu"
        aria-label={`Меню профиля: ${label}`}
        className={cn(
          'absolute right-0 z-50 mt-2 w-52 origin-top-right rounded-lg bg-surface-elevated p-1.5 ring-1 ring-hairline shadow-lg shadow-black/10 transition',
          open ? 'visible scale-100 opacity-100' : 'invisible scale-95 opacity-0',
        )}
      >
        {variant === 'anonymous' && (
          <div className="p-2">
            <p className="text-sm font-medium text-content">Вы не вошли</p>
            <p className="mt-1 text-xs text-content-muted">
              Войдите, чтобы размещать анкеты и отвечать на отзывы.
            </p>
            <Link
              role="menuitem"
              to="/auth"
              className="mt-3 flex h-7 items-center justify-center gap-1.5 rounded-full bg-accent text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              <LogIn className="size-3" aria-hidden="true" />
              Войти
            </Link>
          </div>
        )}

        {variant === 'foreign' && (
          <>
            <dl className="space-y-1.5 p-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-content-muted">Отзывов</dt>
                <dd className="font-medium text-content">{reviewsCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-content-muted">На сайте с</dt>
                <dd className="text-content">
                  {registeredAt ? dateFormat.format(new Date(registeredAt)) : '—'}
                </dd>
              </div>
            </dl>
            <p className="mt-1 border-t border-line px-2 py-2 text-xs text-content-muted">
              Чужой профиль: действий нет, только справка.
            </p>
          </>
        )}

        {variant === 'own' && (
          <div className="space-y-0.5">
            <MenuItem to="/profile/edit" icon={Pencil}>
              Редактировать
            </MenuItem>
            <MenuItem to="/favorites" icon={Heart}>
              Избранное
            </MenuItem>
            {onLogout && (
              <button
                role="menuitem"
                type="button"
                onClick={onLogout}
                className="flex h-7 w-full items-center gap-1.5 rounded-md px-2 text-xs text-content transition-colors hover:bg-chip"
              >
                <LogOut className="size-3" aria-hidden="true" />
                Выйти
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MenuItem({
  to,
  icon: Icon,
  children,
}: {
  to: string
  icon: typeof Pencil
  children: string
}) {
  return (
    <Link
      role="menuitem"
      to={to}
      className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-content transition-colors hover:bg-chip"
    >
      <Icon className="size-3" aria-hidden="true" />
      {children}
    </Link>
  )
}

function Avatar({
  variant,
  name,
  avatarUrl,
}: {
  variant: ProfileVariant
  name?: string
  avatarUrl?: string
}) {
  if (variant === 'anonymous') {
    return (
      <span
        aria-hidden="true"
        className="grid size-6 place-items-center rounded-full ring-1 ring-dashed ring-hairline text-content-muted"
      >
        <UserRound className="size-3" />
      </span>
    )
  }

  return (
    <span className="relative size-6 shrink-0 overflow-hidden rounded-full bg-mat">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="grid size-full place-items-center text-[11px] font-medium text-content-muted">
          {(name ?? '?').slice(0, 1).toUpperCase()}
        </span>
      )}
      {variant === 'own' && (
        <span className="absolute inset-0 rounded-full ring-2 ring-brand-500 ring-offset-1 ring-offset-surface-elevated" />
      )}
    </span>
  )
}
