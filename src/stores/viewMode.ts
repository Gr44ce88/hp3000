import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewMode = 'grid' | 'list'

type ViewModeState = {
  mode: ViewMode
  setMode: (mode: ViewMode) => void
}

export const useViewModeStore = create<ViewModeState>()(
  persist(
    (set) => ({
      mode: 'grid',
      setMode: (mode) => set({ mode }),
    }),
    { name: 'hp3k-view' },
  ),
)
