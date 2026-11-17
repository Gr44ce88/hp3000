import { notFound } from './errors.ts'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Достаёт id из parámetros маршрута; всё, что не uuid, — сразу 404. */
export function idOr404(value: string | string[] | undefined): string {
  const id = Array.isArray(value) ? value[0] : value
  if (!id || !UUID_RE.test(id)) throw notFound()
  return id
}
