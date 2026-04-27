import { Link } from '@tanstack/react-router'

import { NAV_ITEMS } from '@/components/layout/navItems'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import type { IJWTPayload } from '@/lib/auth/auth'
import { useLogout } from '@/lib/auth/useLogout'

interface INavbarProps {
  user: IJWTPayload | null
}

export function Navbar({ user }: INavbarProps) {
  const { logout, isPending } = useLogout()

  return (
    <nav className="navbar sticky top-0 z-30 bg-base-100 shadow-sm min-h-14 px-4">
      {/* Hamburger - mobile only */}
      <div className="sm:hidden mr-1">
        <label
          htmlFor="app-drawer"
          className="btn btn-square btn-ghost"
          aria-label="Open menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </label>
      </div>

      <div className="flex-1">
        <Link to="/" className="text-md font-bold tracking-tight">
          {'Fantasy Realms'}
        </Link>
      </div>

      {/* Desktop nav links */}

      <div className="hidden sm:flex items-center gap-1 mr-2">
        {NAV_ITEMS.map(({ to, label, requiresAuth }) => (
          <>
            {(requiresAuth && user) || !requiresAuth ? (
              <Link
                key={to}
                to={to}
                className="btn btn-ghost btn-sm"
                activeProps={{ className: 'btn btn-info btn-sm' }}
              >
                {label}
              </Link>
            ) : null}
          </>
        ))}
        <>
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin/users"
              className="btn btn-ghost btn-sm"
              activeProps={{ className: 'btn btn-info btn-sm' }}
            >
              {'Admin'}
            </Link>
          )}
        </>
        <>
          {!user && (
            <>
              <Link
                key="/login"
                to="/login"
                className="btn btn-primary btn-sm"
                activeProps={{ className: 'btn btn-accent btn-sm btn-active' }}
              >
                {'Login'}
              </Link>
              <Link
                key="/register"
                to="/register"
                className="btn btn-primary btn-sm"
                activeProps={{ className: 'btn btn-accent btn-sm btn-active' }}
              >
                {'Register'}
              </Link>
            </>
          )}
        </>
      </div>

      <ThemeToggle className="hidden sm:flex mr-12" />
      {user && (
        <Button
          type="button"
          loading={isPending}
          onClick={logout}
          className="hidden sm:flex btn btn-sm"
          variant="error"
        >
          {'Sign out'}
        </Button>
      )}
    </nav>
  )
}
