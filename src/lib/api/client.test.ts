import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { fetchMe } from '@/features/auth/api'
import { useSessionStore } from '@/features/auth/store'
import { server } from '@/test/msw/server'
import { TOKEN_STORAGE_KEY } from '@/lib/api/token'

describe('apiClient', () => {
  it('на 401 разлогинивает и стор, и хранилище', async () => {
    server.use(http.get('*/api/me', () => new HttpResponse(null, { status: 401 })))
    useSessionStore
      .getState()
      .setSession('bad-token', { id: 'u1', email: 'a@b.c', name: 'Аня', phone: '', avatarUrl: '' })

    await expect(fetchMe()).rejects.toThrow()

    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
    expect(useSessionStore.getState().token).toBeNull()
    expect(useSessionStore.getState().user).toBeNull()
  })
})
