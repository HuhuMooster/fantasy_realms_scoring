import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { HandBuilder } from '@/components/calculator/hand-builder'
import { ScoreBreakdown } from '@/components/calculator/score-breakdown'
import { ScoreBreakdownDialog } from '@/components/calculator/score-breakdown-dialog'
import { cardsQueryOptions, editionsQueryOptions } from '@/lib/cards/queries'
import { scoreQueryOptions } from '@/lib/scoring/queries'
import type { TScoreResult } from '@/lib/scoring/types'
import { useCalculatorStore } from '@/lib/stores/calculatorStore'

export const Route = createFileRoute('/(authed)/calculator/')({
  beforeLoad: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(editionsQueryOptions()),
      context.queryClient.prefetchQuery(cardsQueryOptions({})),
    ])
  },
  component: CalculatorPage,
})

function CalculatorPage() {
  const selectedCardIds = useCalculatorStore((s) => s.selectedCardIds)
  const actionConfigs = useCalculatorStore((s) => s.actionConfigs)
  const clearHand = useCalculatorStore((s) => s.clearHand)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [stableResult, setStableResult] = useState<TScoreResult | undefined>(undefined)

  const scoreQuery = useQuery(scoreQueryOptions(selectedCardIds, actionConfigs))

  useEffect(() => {
    if (selectedCardIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStableResult(undefined)
    } else if (scoreQuery.data) {
      setStableResult(scoreQuery.data)
    }
  }, [selectedCardIds.length, scoreQuery.data])

  useEffect(() => {
    return () => {
      clearHand()
    }
  }, [clearHand])

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-bold">{'Calculator'}</h1>
        {stableResult && (
          <button
            type="button"
            className="flex lg:hidden btn btn-xs btn-outline btn-primary"
            onClick={() => dialogRef.current?.showModal()}
          >
            {'Show score'}
          </button>
        )}

        {/* Mobile: score total */}
        <div className="lg:hidden flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            {stableResult?.totalScore ?? 0}
            <span className="text-sm font-normal text-base-content/50 ml-1">
              {'pts'}
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <HandBuilder />
        </section>

        {/* Desktop: inline breakdown */}
        <section className="ml-8 hidden lg:block">
          <h2 className="text-lg font-semibold mb-3">{'Score Breakdown'}</h2>
          {!stableResult && (
            <p className="text-base-content/50">{'Select cards to calculate score.'}</p>
          )}
          {selectedCardIds.length > 0 && <ScoreBreakdown result={stableResult} />}
        </section>
      </div>

      {/* Mobile: score breakdown dialog */}
      <ScoreBreakdownDialog ref={dialogRef} result={stableResult} />
    </div>
  )
}
