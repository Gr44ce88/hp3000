import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

export function Input({ className, invalid, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        'h-10 w-full rounded-md border bg-surface-elevated px-3 text-base text-content sm:text-sm',
        'placeholder:text-content-muted',
        'transition-colors focus:border-brand-500 focus:outline-none',
        invalid ? 'border-danger' : 'border-line',
        className,
      )}
      {...rest}
    />
  )
}
