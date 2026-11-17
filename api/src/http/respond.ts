import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { ZodType } from 'zod'
import { ApiError, badRequest } from './errors.ts'

/** Оборачивает async-хендлер, чтобы исключения доходили до error-middleware. */
export function handle(
  run: (req: Request, res: Response) => Promise<unknown>,
): RequestHandler {
  return (req, res, next: NextFunction) => {
    run(req, res).catch(next)
  }
}

/** Валидирует вход по zod-схеме и отдаёт 422 с ошибками по полям. */
export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body)
  if (result.success) return result.data

  const fields: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_'
    fields[key] ??= issue.message
  }
  throw badRequest('Проверьте поля', fields)
}

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ApiError) {
    res.status(error.status).json(error.toBody())
    return
  }
  console.error('[api]', error)
  res.status(500).json({ message: 'Внутренняя ошибка сервера' })
}
