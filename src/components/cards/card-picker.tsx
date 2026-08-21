import { useState } from 'react'

import { CardTile } from '@/components/cards/card-tile'
import { SuitSelect } from '@/components/cards/suit-select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ICard } from '@/types/cards'

interface ICardPickerProps {
  cards: ICard[]
  selectedIds: string[]
  onToggle: (id: string) => void
  maxSelected?: number
  compact?: boolean
  excludedIds?: string[]
  listClassName?: string
}

export function CardPicker({
  cards,
  selectedIds,
  onToggle,
  maxSelected,
  compact = false,
  excludedIds = [],
  listClassName,
}: ICardPickerProps) {
  const [q, setQ] = useState('')
  const [suitFilter, setSuitFilter] = useState('')

  const filtered = cards.filter((c) => {
    if (suitFilter && c.suit !== suitFilter) return false
    if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  // Cursed items live in their own unlimited pool and never count against
  // the regular hand-size cap (a player can hold as many face-down Cursed
  // Items as they draw -- only the suit-card hand has a limit).
  const cardById = new Map(cards.map((c) => [c.id, c]))
  const cappedSelectedCount = selectedIds.filter(
    (id) => cardById.get(id)?.suit !== 'cursed-item'
  ).length
  const cursedItemSelectedCount = selectedIds.length - cappedSelectedCount

  function canSelectCard(card: ICard): boolean {
    if (card.suit === 'cursed-item') return true
    return maxSelected === undefined || cappedSelectedCount < maxSelected
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Search..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 input-xs sm:input-md"
        />
        <SuitSelect value={suitFilter} onChange={setSuitFilter} />
      </div>

      <p className="text-xs text-base-content/60 mb-2">
        {maxSelected === undefined ? (
          <>
            {selectedIds?.length ?? 0}
            {' selected'}
          </>
        ) : (
          <>
            {cappedSelectedCount}
            {` / ${maxSelected} cards`}
            {cursedItemSelectedCount > 0 &&
              ` (+${cursedItemSelectedCount} cursed item${cursedItemSelectedCount === 1 ? '' : 's'})`}
          </>
        )}
      </p>

      <div
        className={cn(
          'max-h-[44dvh] lg:max-h-[60dvh] overflow-y-auto',
          compact
            ? 'flex flex-col gap-1'
            : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2',
          listClassName
        )}
      >
        {filtered.map((card) => {
          const selected = selectedIds.includes(card.id)
          const excluded = !selected && excludedIds.includes(card.id)
          const disabled = excluded || (!selected && !canSelectCard(card))
          return (
            <CardTile
              key={card.id}
              {...card}
              selected={selected}
              compact={compact}
              disabled={disabled}
              onClick={() => {
                if (disabled) return
                onToggle(card.id)
              }}
            />
          )
        })}
        {filtered.length === 0 && (
          <p className="text-center text-base-content/50 py-8">{'No cards match.'}</p>
        )}
      </div>
    </div>
  )
}
