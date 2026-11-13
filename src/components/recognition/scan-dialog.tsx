import { useState } from 'react'

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

// Upload/capture a photo, show detected cards for review, confirm the corrected list.
export function ScanDialog({
  cards,
  editionIds,
  excludedIds = [],
  maxCards,
  onConfirm,
}: IProps) {
  const [reviewIds, setReviewIds] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const reviewCards = cards.filter((c) => reviewIds?.includes(c.id))
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setBusy(false)
    }
  }

  const toggle = (id: string) =>
    setReviewIds((s) =>
      s?.includes(id) ? s.filter((x) => x !== id) : [...(s ?? []), id]
    )

  return (
    <details className="collapse collapse-arrow bg-base-200">
      <summary className="collapse-title text-sm font-medium">{'Scan photo'}</summary>
      <div className="collapse-content flex flex-col gap-2">
        <label className="fieldset-label">
          {'Photo of cards'}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="file-input file-input-sm"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void scan(file)
            }}
          />
        </label>
        {busy && <span className="loading loading-spinner" aria-label="Scanning" />}
        {error && <p className="text-error text-sm">{error}</p>}
        {reviewIds && (
          <>
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
            <button
              type="button"
              className="btn btn-primary"
              disabled={tooMany > 0}
              onClick={() => {
                onConfirm(reviewIds)
                setReviewIds(null)
              }}
            >
              {'Use these cards'}
            </button>
          </>
        )}
      </div>
    </details>
  )
}
