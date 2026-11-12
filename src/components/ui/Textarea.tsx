import type { ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean
}

export function Textarea({ className, invalid, ...rest }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        'min-h-24 w-full rounded-md border bg-surface-elevated px-3 py-2 text-base text-content sm:text-sm',
        'placeholder:text-content-muted/70',
        'transition-colors focus:border-brand-500 focus:outline-none',
        invalid ? 'border-danger' : 'border-line',
        className,
      )}
      {...rest}
    />
  )
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string
  htmlFor: string
  error?: string | undefined
  hint?: ReactNode
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-content">
        {label}
        {required && <span className="ml-0.5 text-brand-600 dark:text-brand-300">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-content-muted">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
