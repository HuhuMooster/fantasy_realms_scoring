import { ScriptOnce } from '@tanstack/react-router'
import { createContext, use, useEffect, useMemo, useState } from 'react'

import type {
  IThemeProviderProps,
  TTheme,
  TThemeProviderState,
} from '@/components/theme/types'

const initialState: TThemeProviderState = {
  theme: 'dark',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<TThemeProviderState>(initialState)

// references:
// https://ui.shadcn.com/docs/dark-mode/vite
// https://github.com/pacocoursey/next-themes/blob/main/next-themes/src/index.tsx
export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'theme',
  ...props
}: IThemeProviderProps) {
  const [theme, setTheme] = useState<TTheme>(defaultTheme)

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as TTheme | null
    if (stored && stored !== theme) {
      setTheme(stored)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  useEffect(() => {
    const root = window.document.documentElement
    localStorage.setItem(storageKey, theme)
    if (root.getAttribute('data-theme') !== theme) {
      root.setAttribute('data-theme', theme)
    }
  }, [theme, storageKey])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme]
  )

  return (
    <ThemeProviderContext {...props} value={value}>
      <ScriptOnce>
        {/* Apply theme early to avoid FOUC */}
        {`document.documentElement.setAttribute(
            'data-theme',
            localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          )`}
      </ScriptOnce>
      {children}
    </ThemeProviderContext>
  )
}

export const useTheme = () => {
  const context = use(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
