import { forwardRef } from 'react'

import { ScoreBreakdown } from '@/components/calculator/score-breakdown'
import type { TScoreResult } from '@/lib/scoring/types'

interface IProps {
  result: TScoreResult | undefined
}

export const ScoreBreakdownDialog = forwardRef<HTMLDialogElement, IProps>(
  ({ result }, ref) => {
    function close() {
      if (!ref || typeof ref === 'function') return
      ref.current?.close()
    }

    return (
      <dialog ref={ref} className="modal lg:hidden">
        <div className="modal-box w-full max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">{'Score Breakdown'}</h3>
            <button
              type="button"
              className="btn btn-sm btn-ghost btn-circle"
              onClick={close}
            >
              {'✕'}
            </button>
          </div>
          {result && <ScoreBreakdown result={result} />}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit">{'close'}</button>
        </form>
      </dialog>
    )
  }
)
ScoreBreakdownDialog.displayName = 'ScoreBreakdownDialog'
