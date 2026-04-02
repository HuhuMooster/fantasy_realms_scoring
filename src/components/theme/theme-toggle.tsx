import { useEffect, useState } from 'react'

import { THEMES } from '@/components/theme/constants'
import { useTheme } from '@/components/theme/theme-provider'
import { cn } from '@/lib/utils'

function PaletteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
      />
    </svg>
  )
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        type="button"
        tabIndex={0}
        className="btn btn-ghost btn-info btn-sm gap-1"
        aria-label="Switch theme"
        disabled
      >
        <PaletteIcon />
        <span className="hidden sm:inline capitalize text-xs">{theme}</span>
      </button>
    )
  }

  return (
    <div className={cn('dropdown dropdown-end', className)}>
      <button
        type="button"
        tabIndex={0}
        className="btn btn-ghost btn-info btn-sm gap-1"
        aria-label="Switch theme"
      >
        <PaletteIcon />
        <span className="hidden sm:inline capitalize text-xs">{theme}</span>
      </button>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 border border-base-300 rounded-box z-50 w-36 p-1 shadow-lg"
      >
        {THEMES.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => setTheme(t.id)}
              className={cn('text-sm', theme === t.id && 'active font-semibold')}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
