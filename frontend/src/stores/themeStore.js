import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light', // 'light' | 'dark' | 'system'
      isDark: false,

      setTheme: (theme) => {
        const root = window.document.documentElement
        const isDark =
          theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

        root.classList.remove('light', 'dark')
        root.classList.add(isDark ? 'dark' : 'light')

        set({ theme, isDark })
      },

      toggleTheme: () => {
        const { theme, setTheme } = useThemeStore.getState()
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
      },

      initTheme: () => {
        const { theme, setTheme } = useThemeStore.getState()
        setTheme(theme)
      },
    }),
    {
      name: 'induservice-theme-storage',
    }
  )
)