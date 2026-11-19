import { ArrowLeft, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="grid min-h-[50dvh] place-items-center text-center">
      <div>
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-chip text-content-muted">
          <Compass className="size-6" aria-hidden="true" />
        </span>
        <p className="font-mono text-sm text-brand-600 dark:text-brand-300">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-content">Страницы нет</h1>
        <p className="mt-2 text-sm text-content-muted">
          Такого адреса в приложении не существует.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          На главную
        </Link>
      </div>
    </div>
  )
}
