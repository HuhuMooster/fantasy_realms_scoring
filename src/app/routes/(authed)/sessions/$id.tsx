import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import {
  Link,
  Outlet,
  createFileRoute,
  useMatchRoute,
  useRouter,
} from '@tanstack/react-router'

import { RankingTable } from '@/components/sessions/ranking-table'
import {
  completeSessionMutationOptions,
  deleteSessionMutationOptions,
  sessionQueryOptions,
  sessionsQueryOptions,
} from '@/lib/sessions/queries'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/(authed)/sessions/$id')({
  beforeLoad: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(sessionQueryOptions(params.id))
  },
  component: SessionDetailPage,
})

function SessionDetailPage() {
  const { id } = Route.useParams()
  const matchRoute = useMatchRoute()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: session } = useSuspenseQuery(sessionQueryOptions(id))

  const deleteMutation = useMutation({
    ...deleteSessionMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionQueryOptions(id).queryKey })
      queryClient.invalidateQueries({ queryKey: sessionsQueryOptions().queryKey })
      router.navigate({ to: '/sessions' })
    },
  })

  const completeMutation = useMutation({
    ...completeSessionMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionQueryOptions(id).queryKey })
      queryClient.invalidateQueries({ queryKey: sessionsQueryOptions().queryKey })
    },
  })

  if (matchRoute({ to: '/sessions/$id/edit', params: { id } })) {
    return <Outlet />
  }

  function handleDelete() {
    if (!confirm('Delete this game?')) return
    deleteMutation.mutate({ data: { id } })
  }

  const allHandsSaved =
    session.players.length > 0 && session.players.every((p) => p.finalScore !== null)

  const dateStr = new Date(session.date).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Link to="/sessions" className="btn btn-ghost btn-sm mb-4">
        {'Games'}
      </Link>

      <div className="flex items-start justify-between gap-3 mb-1">
        <h1 className="text-2xl font-bold leading-tight">{session.name}</h1>
        <span
          className={cn(
            'badge badge-md shrink-0 mt-1',
            session.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'
          )}
        >
          {session.status === 'COMPLETED' ? 'Completed' : 'In progress'}
        </span>
      </div>
      <p className="text-sm text-base-content/50 mb-5">{dateStr}</p>

      <section className="mb-5">
        <h2 className="text-base font-semibold mb-2">
          {session.status === 'COMPLETED' ? 'Rankings' : 'Players'}
        </h2>
        <RankingTable players={session.players} status={session.status} />
      </section>

      <div className="flex flex-col gap-2">
        {session.status === 'IN_PROGRESS' && (
          <Link
            to="/sessions/$id/edit"
            params={{ id }}
            className="btn btn-primary w-full"
          >
            {'Enter hands'}
          </Link>
        )}

        {session.status === 'IN_PROGRESS' && allHandsSaved && (
          <button
            type="button"
            className="btn btn-success w-full"
            onClick={() => completeMutation.mutate({ data: { id } })}
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending && (
              <span className="loading loading-spinner loading-sm" />
            )}
            {'Mark as completed'}
          </button>
        )}

        <button
          type="button"
          className="btn btn-ghost btn-sm text-error w-full"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            'Delete game'
          )}
        </button>
      </div>
    </div>
  )
}
