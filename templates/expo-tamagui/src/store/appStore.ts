import { create } from 'zustand'

export type ThemePreference = 'system' | 'light' | 'dark'

interface AppState {
  count: number
  themePreference: ThemePreference
  increment: () => void
  reset: () => void
  setThemePreference: (preference: ThemePreference) => void
}

export const useAppStore = create<AppState>((set) => ({
  count: 0,
  themePreference: 'system',
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
  setThemePreference: (themePreference) => set({ themePreference }),
}))
