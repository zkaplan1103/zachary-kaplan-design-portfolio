import { create } from 'zustand'

interface UIStore {
  theme: 'light' | 'dark'
  navOpen: boolean
  introComplete: boolean
  introVisible: boolean
  isNight: boolean          // western town day/night — shared with interior pages
  toggleTheme: () => void
  toggleNight: () => void
  setNavOpen: (open: boolean) => void
  setIntroComplete: (val: boolean) => void
  setIntroVisible: (val: boolean) => void
}

function applyTheme(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export const useUIStore = create<UIStore>((set) => ({
  theme: 'dark',
  navOpen: false,
  introComplete: false,
  introVisible: true,
  isNight: true,
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return { theme: next }
    }),
  toggleNight: () => set((state) => ({ isNight: !state.isNight })),
  setNavOpen: (open) => set({ navOpen: open }),
  setIntroComplete: (val) => set({ introComplete: val }),
  setIntroVisible: (val) => set({ introVisible: val }),
}))
