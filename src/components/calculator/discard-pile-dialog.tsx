import { forwardRef } from 'react'

import { CardPicker } from '@/components/cards/card-picker'
import { ScanDialog } from '@/components/recognition/scan-dialog'
import type { ICard } from '@/types/cards'

interface IProps {
  cards: ICard[]
  editionIds: string[]
  discardCardIds: string[]
  excludedCardIds: string[]
  onToggle: (cardId: string) => void
  // receives scanned ids not already discarded and not held in a hand
  onScan: (cardIds: string[]) => void
}

export const DiscardPileDialog = forwardRef<HTMLDialogElement, IProps>(
  ({ cards, editionIds, discardCardIds, excludedCardIds, onToggle, onScan }, ref) => {
    function close() {
      if (!ref || typeof ref === 'function') return
      ref.current?.close()
    }

    return (
      <dialog ref={ref} className="modal">
        <div className="modal-box w-full max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg">{'Discard Pile'}</h3>
            <button
              type="button"
              className="btn btn-sm btn-ghost btn-circle"
              onClick={close}
            >
              {'✕'}
            </button>
          </div>
          <p className="text-xs text-base-content/60 mb-2">
            {"Cards already in a player's hand can't be discarded."}
          </p>
          <ScanDialog
            cards={cards}
            editionIds={editionIds}
            onConfirm={(ids) =>
              onScan(
                ids.filter(
                  (id) => !discardCardIds.includes(id) && !excludedCardIds.includes(id)
                )
              )
            }
          />
          <CardPicker
            cards={cards}
            selectedIds={discardCardIds}
            onToggle={onToggle}
            excludedIds={excludedCardIds}
            compact
          />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit">{'close'}</button>
        </form>
      </dialog>
    )
  }
)
DiscardPileDialog.displayName = 'DiscardPileDialog'
