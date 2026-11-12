import { cn } from '@/lib/cn'

export type SpinnerProps = {
  className?: string
  label?: string
}

export function Spinner({ className, label = 'Загрузка' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 text-xs text-content-muted"
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-4 rounded-full border-2 border-brand-500 border-t-transparent motion-safe:animate-spin',
          className,
        )}
      />
      {label}
    </span>
  )
}

export function FullPageSpinner() {
  return (
    <div className="grid min-h-[60dvh] place-items-center">
      <Spinner />
    </div>
  )
}
