import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type FavoritesState = {
  ids: string[]
  toggle: (id: string) => void
  clear: () => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) =>
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((item) => item !== id)
            : [id, ...state.ids],
        })),
      clear: () => set({ ids: [] }),
    }),
    { name: 'hp3k-favorites' },
  ),
)

export const useIsFavorite = (id: string) => useFavoritesStore((state) => state.ids.includes(id))
