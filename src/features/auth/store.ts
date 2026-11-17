import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { SessionUser } from '@/features/auth/api'
import { TOKEN_STORAGE_KEY } from '@/lib/api/token'

type SessionState = {
  token: string | null
  user: SessionUser | null
  demoOptOut: boolean
  setSession: (token: string, user: SessionUser) => void
  setUser: (user: SessionUser) => void
  /** сессия кончилась сама (401): демо-вход не блокируем */
  expire: () => void
  clear: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      demoOptOut: false,
      setSession: (token, user) => {
        localStorage.setItem(TOKEN_STORAGE_KEY, token)
        set({ token, user, demoOptOut: false })
      },
      setUser: (user) => set({ user }),
      expire: () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        set({ token: null, user: null })
      },
      clear: () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        set({ token: null, user: null, demoOptOut: true })
      },
    }),
    {
      name: 'hp3k-session',
      partialize: (state) => ({ token: state.token, user: state.user, demoOptOut: state.demoOptOut }),
    },
  ),
)

export const useSession = () =>
  useSessionStore(useShallow((state) => ({ token: state.token, user: state.user })))
