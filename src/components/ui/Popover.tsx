import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export type PopoverProps = {
  label: string
  icon: ReactNode
  /** число активных условий — показывается точкой с цифрой */
  count?: number
  /** закрывать панель после клика внутри (для списков с одним выбором) */
  closeOnSelect?: boolean
  children: (close: () => void) => ReactNode
  className?: string
}

/** Кнопка-виджет с выпадающей панелью: Esc, клик вне и повторный клик закрывают. */
export function Popover({
  label,
  icon,
  count = 0,
  closeOnSelect = false,
  children,
  className,
}: PopoverProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const close = () => setOpen(false)

  // Фокус возвращаем на кнопку из эффекта, а не из рендера.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus()
    wasOpen.current = open
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className={cn('relative', className)}
      onClick={closeOnSelect && open ? () => setOpen(false) : undefined}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs transition-colors',
          count > 0 || open
            ? 'bg-chip font-medium text-content ring-1 ring-content/15'
            : 'bg-chip text-content-muted hover:text-content',
        )}
      >
        {icon}
        {label}
        {count > 0 && (
          <span className="grid size-4 place-items-center rounded-full bg-accent text-[10px] font-semibold text-white tabular-nums">
            {count}
          </span>
        )}
        <ChevronDown
          className={cn('size-3 text-content-muted transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={label}
          className="absolute top-9 left-0 z-40 w-72 origin-top-left rounded-lg bg-surface-elevated p-3 ring-1 ring-hairline shadow-lg shadow-black/15"
        >
          {children(close)}
        </div>
      )}
    </div>
  )
}

/** Внутренний список одиночного выбора для панелей-виджетов. */
export function PopoverOption({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex h-7 w-full items-center rounded-md px-2 text-xs transition-colors',
        active ? 'bg-chip font-medium text-content' : 'text-content-muted hover:bg-chip hover:text-content',
      )}
    >
      {children}
    </button>
  )
}
