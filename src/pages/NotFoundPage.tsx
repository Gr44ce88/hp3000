import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="grid min-h-[50dvh] place-items-center text-center">
      <div>
        <p className="font-mono text-sm text-brand-600 dark:text-brand-300">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-content">Страницы нет</h1>
        <p className="mt-2 text-sm text-content-muted">
          Такого адреса в приложении не существует.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          На главную
        </Link>
      </div>
    </div>
  )
}
