import { Link, useRouterState } from '@tanstack/react-router'
import { useLayoutEffect } from 'react'

import { NAV_ITEMS } from '@/components/layout/navItems'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import type { IJWTPayload } from '@/lib/auth/auth'
import { useLogout } from '@/lib/auth/useLogout'

export function DrawerMenu({ user }: { user: IJWTPayload | null }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { logout, isPending } = useLogout()

  // Close drawer on navigation
  useLayoutEffect(() => {
    const el = document.getElementById('app-drawer') as HTMLInputElement | null
    if (el) el.checked = false
  }, [pathname])

  return (
    <div className="bg-base-200 w-72 min-h-full flex flex-col p-5">
      <div className="flex flex-row">
        <p className="text-xl font-bold px-2 mb-6">{'Fantasy Realms'}</p>
        <ThemeToggle />
      </div>

      <ul className="menu p-0 gap-0.5 flex-1 text-base">
        {user && (
          <>
            {NAV_ITEMS.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  activeProps={{ className: 'active text-primary font-medium' }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </>
        )}
        {user?.role === 'ADMIN' && (
          <>
            <li className="menu-title mt-4 text-xs">{'Admin'}</li>
            <li>
              <Link
                to="/admin/users"
                activeProps={{ className: 'active text-primary font-medium' }}
              >
                {'Admin panel'}
              </Link>
            </li>
          </>
        )}
      </ul>
      <div className="flex flex-col mt-auto gap-4 w-2/6">
        {!user && (
          <Link
            key="/login"
            to="/login"
            className="btn btn-primary btn-sm"
            activeProps={{ className: 'btn btn-accent btn-sm btn-active' }}
          >
            {'Login'}
          </Link>
        )}
        {user && (
          <Button
            type="button"
            loading={isPending}
            onClick={logout}
            className="btn btn-sm"
            variant="error"
          >
            {'Sign out'}
          </Button>
        )}
      </div>
    </div>
  )
}
