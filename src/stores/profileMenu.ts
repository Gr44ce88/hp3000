import { create } from 'zustand'

type ProfileMenuState = {
  openId: string | null
  setOpen: (id: string | null) => void
}

/** Открытым может быть только одно меню профиля — чтобы поповеры не перекрывались. */
export const useProfileMenuStore = create<ProfileMenuState>((set) => ({
  openId: null,
  setOpen: (id) => set({ openId: id }),
}))
