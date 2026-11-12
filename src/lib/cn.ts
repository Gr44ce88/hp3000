import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Склеивает классы и разрешает конфликты утилит Tailwind (последний выигрывает). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
