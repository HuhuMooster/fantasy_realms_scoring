import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useRef, useState } from 'react'

import { ScoreBreakdown } from '@/components/calculator/score-breakdown'
import { ScoreBreakdownDialog } from '@/components/calculator/score-breakdown-dialog'
import { PlayerHandForm } from '@/components/sessions/player-hand-form'
import type { TActionConfig } from '@/lib/calculator/actions'
import { cardsQueryOptions } from '@/lib/cards/queries'
import type { TScoreResult } from '@/lib/scoring/types'
import {
  completeSessionMutationOptions,
  sessionQueryOptions,
  sessionsQueryOptions,
} from '@/lib/sessions/queries'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/(authed)/sessions/$id/edit')({
  beforeLoad: async ({ context, params }) => {
    const session = await context.queryClient.ensureQueryData(
      sessionQueryOptions(params.id)
    )
    const editionId =
      session.editionIds.length === 1 ? session.editionIds[0] : undefined
    await Promise.all([
      context.queryClient.prefetchQuery(cardsQueryOptions({ editionId })),
    ])
  },
  component: EditSessionPage,
})

function EditSessionPage() {
  const { id } = Route.useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeIdx, setActiveIdx] = useState(0)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [stableResult, setStableResult] = useState<TScoreResult | undefined>(undefined)

  const { data: session } = useSuspenseQuery(sessionQueryOptions(id))

  const allHandsSaved =
    session.players.length > 0 && session.players.every((p) => p.finalScore !== null)

  const completeMutation = useMutation({
    ...completeSessionMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionQueryOptions(id).queryKey })
      queryClient.invalidateQueries({ queryKey: sessionsQueryOptions().queryKey })
      router.navigate({ to: '/sessions/$id', params: { id } })
    },
  })

  const [handsByPlayerId, setHandsByPlayerId] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(session.players.map((p) => [p.id, p.cardIds]))
  )
  const [actionConfigsByPlayerId, setActionConfigsByPlayerId] = useState<
    Record<string, Record<string, TActionConfig>>
  >({})

  function handleSelectionChange(playerId: string, cardIds: string[]) {
    setHandsByPlayerId((prev) => ({ ...prev, [playerId]: cardIds }))
  }

  function handleActionConfigsChange(
    playerId: string,
    configs: Record<string, TActionConfig>
  ) {
    setActionConfigsByPlayerId((prev) => ({ ...prev, [playerId]: configs }))
  }

  function switchPlayer(i: number) {
    setActiveIdx(i)
    setStableResult(undefined)
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <Link to="/sessions/$id" params={{ id }} className="btn btn-ghost btn-sm">
          {'<- '}
          {session.name}
        </Link>

        {stableResult && (
          <button
            type="button"
            className="flex lg:hidden btn btn-xs btn-outline btn-primary"
            onClick={() => dialogRef.current?.showModal()}
          >
            {'Show score'}
          </button>
        )}
      </div>

      {allHandsSaved && session.status === 'IN_PROGRESS' && (
        <button
          type="button"
          className="btn btn-success w-full mb-4"
          onClick={() => completeMutation.mutate({ data: { id } })}
          disabled={completeMutation.isPending}
        >
          {completeMutation.isPending && (
            <span className="loading loading-spinner loading-sm" />
          )}
          {'Mark as completed'}
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
            {session.players.map((player, i) => (
              <button
                key={player.id}
                type="button"
                onClick={() => switchPlayer(i)}
                className={cn(
                  'btn btn-sm shrink-0',
                  activeIdx === i ? 'btn-primary' : 'btn-outline'
                )}
              >
                {player.nickname}
                {player.finalScore !== null && (
                  <span className="ml-1 opacity-70 font-normal">
                    {player.finalScore}
                  </span>
                )}
              </button>
            ))}
          </div>

          {session.players[activeIdx] &&
            (() => {
              const activePlayer = session.players[activeIdx]
              const excludedCardIds = Object.entries(handsByPlayerId)
                .filter(([pid]) => pid !== activePlayer.id)
                .flatMap(([, ids]) => ids)
              return (
                <PlayerHandForm
                  key={activePlayer.id}
                  sessionId={id}
                  playerId={activePlayer.id}
                  nickname={activePlayer.nickname}
                  editionIds={session.editionIds}
                  initialCardIds={
                    handsByPlayerId[activePlayer.id] ?? activePlayer.cardIds
                  }
                  initialActionConfigs={actionConfigsByPlayerId[activePlayer.id]}
                  excludedCardIds={excludedCardIds}
                  onSelectionChange={(cardIds) =>
                    handleSelectionChange(activePlayer.id, cardIds)
                  }
                  onActionConfigsChange={(configs) =>
                    handleActionConfigsChange(activePlayer.id, configs)
                  }
                  onScoreResult={setStableResult}
                />
              )
            })()}
        </section>

        {/* Desktop: inline breakdown */}
        <section className="ml-8 hidden lg:block">
          <h2 className="text-lg font-semibold mb-3">{'Score Breakdown'}</h2>
          {!stableResult && (
            <p className="text-base-content/50">{'Select cards to calculate score.'}</p>
          )}
          {stableResult && <ScoreBreakdown result={stableResult} />}
        </section>
      </div>

      {/* Mobile: score breakdown dialog */}
      <ScoreBreakdownDialog ref={dialogRef} result={stableResult} />
    </div>
  )
}
