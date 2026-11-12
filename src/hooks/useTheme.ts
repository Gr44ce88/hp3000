import { useThemeStore } from '@/stores/theme'

export function useTheme() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const toggle = useThemeStore((state) => state.toggle)
  return { theme, setTheme, toggle, isDark: theme === 'dark' }
}
