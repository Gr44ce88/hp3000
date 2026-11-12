import { fetchMe } from '@/features/auth/api'
import { useSessionStore } from '@/features/auth/store'
import { apiClient } from '@/lib/api/client'

import type { SessionUser } from '@/features/auth/api'

type DemoResponse = { token: string; user: SessionUser }

/**
 * Только в dev: держит демо-сессию, чтобы можно было смотреть закрытые экраны.
 * Существующий токен проверяется через /me; протухший или отсутствующий меняется на новый.
 */
export async function ensureDemoSession(): Promise<void> {
  if (!import.meta.env.DEV) return

  const { token, setSession, demoOptOut } = useSessionStore.getState()

  if (demoOptOut) return

  if (token) {
    try {
      await fetchMe()
      return
    } catch {
      // токен от прошлого запуска сервера — берём новый ниже
    }
  }

  try {
    const { data } = await apiClient.post<DemoResponse>('/auth/demo')
    setSession(data.token, data.user)
  } catch {
    // сервер недоступен — работаем анонимно
  }
}
