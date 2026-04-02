import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { authQueryOptions } from '@/lib/auth/queries'

const AUTH_ONLY_PATHS = ['/login', '/register']

export const Route = createFileRoute('/(auth)')({
  component: RouteComponent,
  beforeLoad: async ({ context, location }) => {
    if (!AUTH_ONLY_PATHS.includes(location.pathname)) return

    const user = await context.queryClient.ensureQueryData(authQueryOptions())
    if (user) throw redirect({ to: '/' })
  },
})

function RouteComponent() {
  return <Outlet />
}
