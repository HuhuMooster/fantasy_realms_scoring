import { useState } from 'react'

import { recognizeCards } from '@/app/server/recognition'
import { CardPicker } from '@/components/cards/card-picker'
import type { ICard } from '@/types/cards'

interface IProps {
  cards: ICard[]
  editionIds: string[]
  onConfirm: (cardIds: string[]) => void
}

// Upload/capture a photo, show detected cards for review, confirm the corrected list.
export function ScanDialog({ cards, editionIds, onConfirm }: IProps) {
  const [ids, setIds] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function scan(file: File) {
    const data = new FormData()
    data.append('image', file)
    for (const id of editionIds) data.append('editionId', id)
    setBusy(true)
    setError('')
    try {
      const result = await recognizeCards({ data })
      setIds(result.matches.map((m) => m.cardId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setBusy(false)
    }
  }

  const toggle = (id: string) =>
    setIds((s) => (s?.includes(id) ? s.filter((x) => x !== id) : [...(s ?? []), id]))

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
        {ids && (
          <>
            <CardPicker cards={cards} selectedIds={ids} onToggle={toggle} compact />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onConfirm(ids)
                setIds(null)
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
