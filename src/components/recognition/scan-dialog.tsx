import { useRef, useState } from 'react'

import { recognizeCards } from '@/app/server/recognition'
import { CardPicker } from '@/components/cards/card-picker'
import type { ICard } from '@/types/cards'

interface IProps {
  cards: ICard[]
  editionIds: string[]
  // cards that can't be used here (held by another player, already discarded): never offered
  excludedIds?: string[]
  // hand limit for the reviewed cards (it can depend on them); omit for the discard pile
  maxCards?: (cards: ICard[]) => number
  onConfirm: (cardIds: string[]) => void
}

function CameraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

// Camera button: take/upload a photo, review the detected cards in a modal, confirm the corrected list.
export function ScanDialog({
  cards,
  editionIds,
  excludedIds = [],
  maxCards,
  onConfirm,
}: IProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [reviewIds, setReviewIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const reviewCards = cards.filter((c) => reviewIds.includes(c.id))
  const max = maxCards?.(reviewCards)
  // Cursed Items don't count towards the hand limit, same as CardPicker
  const tooMany =
    max === undefined
      ? 0
      : reviewCards.filter((c) => c.suit !== 'cursed-item').length - max

  async function scan(file: File) {
    const data = new FormData()
    data.append('image', file)
    for (const id of editionIds) data.append('editionId', id)
    setBusy(true)
    setError('')
    try {
      const result = await recognizeCards({ data })
      setReviewIds(
        result.matches.map((m) => m.cardId).filter((id) => !excludedIds.includes(id))
      )
      dialogRef.current?.showModal()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setBusy(false)
    }
  }

  const toggle = (id: string) =>
    setReviewIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        className="btn btn-sm btn-outline gap-1"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <span className="loading loading-spinner loading-xs" aria-hidden="true" />
        ) : (
          <CameraIcon />
        )}
        {busy ? 'Scanning…' : 'Scan'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="Photo of cards"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = '' // so picking the same photo again still triggers a scan
          if (file) void scan(file)
        }}
      />
      {error && <p className="text-error text-sm">{error}</p>}

      <dialog ref={dialogRef} className="modal">
        <div className="modal-box w-full max-w-sm flex flex-col gap-2">
          <h3 className="font-bold text-lg">{'Detected cards'}</h3>
          <p className="text-xs text-base-content/60">
            {'Tap a card to add or remove it.'}
          </p>
          <CardPicker
            cards={cards}
            selectedIds={reviewIds}
            onToggle={toggle}
            excludedIds={excludedIds}
            maxSelected={max}
            compact
          />
          {tooMany > 0 && (
            <p className="text-warning text-sm">
              {`Hand limit is ${max} cards, remove ${tooMany}.`}
            </p>
          )}
          <div className="modal-action mt-0">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => dialogRef.current?.close()}
            >
              {'Cancel'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={tooMany > 0}
              onClick={() => {
                onConfirm(reviewIds)
                dialogRef.current?.close()
              }}
            >
              {'Use these cards'}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit">{'close'}</button>
        </form>
      </dialog>
    </div>
  )
}
