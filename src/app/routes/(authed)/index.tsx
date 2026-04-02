import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { dashboardQueryOptions } from '@/lib/dashboard/queries'
import { cn, formatDate } from '@/lib/utils'

export const Route = createFileRoute('/(authed)/')({
  beforeLoad: async ({ context }) => {
    await context.queryClient.prefetchQuery(dashboardQueryOptions())
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { data } = useSuspenseQuery(dashboardQueryOptions())

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{`Welcome, ${data.username}`}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="stat bg-base-100 border border-base-300 rounded-box p-4 shadow-sm shadow-primary">
          <div className="stat-title text-xs">{'Total games'}</div>
          <div className="stat-value text-2xl">{data.totalSessions}</div>
        </div>
        <div className="stat bg-base-100 border border-base-300 rounded-box p-4 shadow-sm shadow-primary">
          <div className="stat-title text-xs">{'Completed'}</div>
          <div className="stat-value text-2xl">{data.completedSessions}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">{'Recent games'}</h2>
        <Link to="/sessions" className="link link-primary text-sm">
          {'View all'}
        </Link>
      </div>

      <div className="mb-5">
        <Link to="/sessions/new" className="btn btn-primary w-full">
          {'+ New game'}
        </Link>
      </div>

      {data.recent.length === 0 ? (
        <div className="text-center py-10 text-base-content/50">
          <p className="mb-2">{'No games yet.'}</p>
          <Link to="/sessions/new" className="link link-primary">
            {'Start your first game'}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.recent.map((s) => {
            const dateStr = formatDate(s.date)
            return (
              <Link
                key={s.id}
                to="/sessions/$id"
                params={{ id: s.id }}
                className="card bg-base-100 border border-base-300 shadow-sm shadow-primary"
              >
                <div className="card-body p-3 flex-row items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{s.name}</p>
                    <p className="text-xs text-base-content/50">
                      {dateStr}
                      {'  '}
                      {s.playerCount} {s.playerCount === 1 ? 'player' : 'players'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'badge badge-sm shrink-0',
                      s.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'
                    )}
                  >
                    {s.status === 'COMPLETED' ? 'Done' : 'In progress'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
