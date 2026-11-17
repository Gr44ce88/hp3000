import { createHash, randomBytes } from 'node:crypto'
import { config } from '../config.ts'
import { one } from '../db/pool.ts'

export type PublicUser = {
  id: string
  email: string
  name: string
  phone: string
  avatarUrl: string
}

export type UserRow = {
  id: string
  email: string
  name: string
  phone: string
  avatar_url: string
}

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex')

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  const expires = new Date(Date.now() + config.sessionTtlDays * 86_400_000)
  await one(
    'insert into sessions (token_hash, user_id, expires_at) values ($1, $2, $3)',
    [hashToken(token), userId, expires.toISOString()],
  )
  return token
}

export async function dropSession(token: string): Promise<void> {
  await one('delete from sessions where token_hash = $1', [hashToken(token)])
}

export async function purgeExpiredSessions(): Promise<void> {
  await one('delete from sessions where expires_at < now()')
}

export function tokenFromHeader(header: string | undefined): string {
  const value = header ?? ''
  return value.startsWith('Bearer ') ? value.slice(7).trim() : ''
}

/** Пользователь по токену либо null. Просроченная сессия тоже null. */
export async function userByToken(token: string): Promise<UserRow | null> {
  if (!token) return null
  return one<UserRow>(
    `select u.id, u.email, u.name, u.phone, u.avatar_url
     from sessions s
     join users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)],
  )
}

export const publicUser = (user: UserRow): PublicUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  phone: user.phone,
  avatarUrl: user.avatar_url,
})
