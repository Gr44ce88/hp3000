/** Прикладная ошибка с HTTP-статусом и полями — приводится к контракту `{ message, errors }`. */
export class ApiError extends Error {
  readonly status: number
  readonly fields: Record<string, string>

  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }

  toBody(): { message: string; errors?: Record<string, string> } {
    return Object.keys(this.fields).length > 0
      ? { message: this.message, errors: this.fields }
      : { message: this.message }
  }
}

export const badRequest = (message: string, fields?: Record<string, string>) =>
  new ApiError(422, message, fields)
export const unauthorized = () => new ApiError(401, 'Нужна авторизация')
export const forbidden = (message: string) => new ApiError(403, message)
export const notFound = (message = 'Не найдено') => new ApiError(404, message)
export const conflict = (message: string) => new ApiError(409, message)
