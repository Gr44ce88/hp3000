import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type HistoryEntry = { id: string; at: string }

type HistoryState = {
  entries: HistoryEntry[]
  push: (id: string) => void
  clear: () => void
}

/** История просмотров — только локально, на сервер не ходит. */
export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      push: (id) =>
        set((state) => ({
          entries: [{ id, at: new Date().toISOString() }, ...state.entries.filter((e) => e.id !== id)].slice(0, 30),
        })),
      clear: () => set({ entries: [] }),
    }),
    { name: 'hp3k-history' },
  ),
)
