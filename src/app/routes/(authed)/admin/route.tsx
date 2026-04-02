import { Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useRouterState } from '@tanstack/react-router'

import { adminQueryOptions } from '@/lib/auth/queries'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/(authed)/admin')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const admin = await context.queryClient.ensureQueryData({
      ...adminQueryOptions(),
      revalidateIfStale: true,
    })

    if (!admin) {
      throw redirect({
        to: '/login',
      })
    }
  },
})

function RouteComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <h1 className="text-2xl font-bold flex-1">{'Admin'}</h1>
      </div>
      <div className="tabs tabs-border mb-5">
        <Link
          to="/admin/users"
          className={cn('tab', pathname.startsWith('/admin/users') && 'tab-active')}
        >
          {'Users'}
        </Link>
        <Link
          to="/admin/invites"
          className={cn('tab', pathname.startsWith('/admin/invites') && 'tab-active')}
        >
          {'Invite codes'}
        </Link>
      </div>
      <Outlet />
    </div>
  )
}
