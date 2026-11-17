import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { unauthorized } from '../http/errors.ts'
import { tokenFromHeader, userByToken, type UserRow } from './sessions.ts'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserRow
      token?: string
    }
  }
}

/** Требует валидную сессию; кладёт пользователя в req.user. */
export const requireAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const token = tokenFromHeader(req.header('authorization'))
  userByToken(token)
    .then((user) => {
      if (!user) {
        next(unauthorized())
        return
      }
      req.user = user
      req.token = token
      next()
    })
    .catch(next)
}

/** Для ручек, где авторизация необязательна, но нужна, если есть. */
export const attachUser: RequestHandler = (req, _res, next) => {
  const token = tokenFromHeader(req.header('authorization'))
  userByToken(token)
    .then((user) => {
      if (user) {
        req.user = user
        req.token = token
      }
      next()
    })
    .catch(next)
}

export function currentUser(req: Request): UserRow {
  if (!req.user) throw unauthorized()
  return req.user
}
