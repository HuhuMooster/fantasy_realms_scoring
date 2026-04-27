import { useSuspenseQuery } from '@tanstack/react-query'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { DrawerMenu } from '@/components/layout/drawer-menu'
import { Navbar } from '@/components/layout/navbar'
import { ThemeProvider } from '@/components/theme/theme-provider'
import type { IJWTPayload } from '@/lib/auth/auth'
import { authQueryOptions } from '@/lib/auth/queries'

export const Route = createFileRoute('/(authed)')({
  beforeLoad: async ({ context, location }) => {
    const publicPaths = ['/login', '/register', '/calculator', '/cards']
    if (publicPaths.includes(location.pathname)) return

    const user = await context.queryClient.ensureQueryData(authQueryOptions())
    if (!user) throw redirect({ to: '/calculator' })

    return { user } as { user: IJWTPayload }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { data: user } = useSuspenseQuery(authQueryOptions())

  return (
    <ThemeProvider>
      <div className="drawer">
        <input id="app-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col min-h-screen">
          <Navbar user={user} />
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
        <div className="drawer-side z-50">
          <label
            htmlFor="app-drawer"
            aria-label="close menu"
            className="drawer-overlay"
          />
          <DrawerMenu user={user} />
        </div>
      </div>
    </ThemeProvider>
  )
}
