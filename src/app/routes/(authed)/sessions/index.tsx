import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { SessionCard } from '@/components/sessions/session-card'
import { sessionsQueryOptions } from '@/lib/sessions/queries'

export const Route = createFileRoute('/(authed)/sessions/')({
  beforeLoad: async ({ context }) => {
    await context.queryClient.prefetchQuery(sessionsQueryOptions())
  },
  component: SessionsPage,
})

function SessionsPage() {
  const { data: sessions } = useSuspenseQuery(sessionsQueryOptions())

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">{'Games'}</h1>
        <Link to="/sessions/new" className="btn btn-primary btn-xs sm:btn-sm">
          {'+ New game'}
        </Link>
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-16 text-base-content/50">
          <p className="text-lg mb-2">{'No games yet.'}</p>
          <Link to="/sessions/new" className="link link-primary">
            {'Create your first game'}
          </Link>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="flex flex-col gap-3">
          {sessions.map((s) => (
            <SessionCard key={s.id} {...s} />
          ))}
        </div>
      )}
    </div>
  )
}
