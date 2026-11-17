import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2'

/** argon2id с параметрами OWASP-минимума: 19 MiB, 2 итерации, 1 поток. */
const OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const

export function hashPassword(password: string): Promise<string> {
  return argonHash(password, OPTIONS)
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    return await argonVerify(stored, password)
  } catch {
    return false
  }
}
