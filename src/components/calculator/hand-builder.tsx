import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { ActionPanel } from '@/components/calculator/action-panel'
import { CardPicker } from '@/components/cards/card-picker'
import { CURSED_HOARD_SUITS_EDITION_SLUG } from '@/lib/calculator/actions'
import { cardsQueryOptions, editionsQueryOptions } from '@/lib/cards/queries'
import { calcMaxHand, useCalculatorStore } from '@/lib/stores/calculatorStore'
import { cn } from '@/lib/utils'

interface IHandSizeIndicatorProps {
  maxSelected: number
  selectedCardCount: number
  hasCards: boolean
  clearHand: () => void
  playerCount: number
  setPlayerCount: (count: number) => void
}

function HandSizeIndicator({
  maxSelected,
  selectedCardCount,
  hasCards,
  clearHand,
  playerCount,
  setPlayerCount,
}: IHandSizeIndicatorProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-base-content/60">
        {'Hand: '}
        {selectedCardCount}
        {' / '}
        {maxSelected}
        {' cards'}
      </span>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-base-content/60">
          {'Players'}
          <input
            type="number"
            min={1}
            max={10}
            value={playerCount}
            onChange={(e) => setPlayerCount(Number(e.target.value) || 1)}
            className="input input-xs w-14"
          />
        </label>
        <button
          type="button"
          onClick={clearHand}
          disabled={!hasCards}
          className="btn btn-xs text-error"
        >
          {'Clear hand'}
        </button>
      </div>
    </div>
  )
}

export function HandBuilder() {
  const {
    activeEditionIds,
    selectedCardIds,
    actionConfigs,
    playerCount,
    toggleEdition,
    addCard,
    removeCard,
    clearHand,
    setActionConfig,
    setPlayerCount,
  } = useCalculatorStore()

  const { data: editionsData } = useSuspenseQuery(editionsQueryOptions())

  const baseEdition = editionsData.find((ed) => ed.slug === 'base')

  useEffect(() => {
    if (baseEdition?.id && !activeEditionIds.includes(baseEdition.id)) {
      toggleEdition(baseEdition.id)
    }
  }, [baseEdition, activeEditionIds, toggleEdition])

  const cardsQuery = useQuery(cardsQueryOptions({ editionIds: activeEditionIds }))

  const allCards = cardsQuery.data ?? []
  const handCards = allCards.filter((c) => selectedCardIds.includes(c.id))
  const cursedHoardSuitsActive = editionsData.some(
    (ed) =>
      ed.slug === CURSED_HOARD_SUITS_EDITION_SLUG && activeEditionIds.includes(ed.id)
  )
  const maxSelected = calcMaxHand(
    handCards.map((c) => c.name),
    cursedHoardSuitsActive
  )
  const cappedHandCount = handCards.filter((c) => c.suit !== 'cursed-item').length

  function handleToggle(id: string) {
    if (selectedCardIds.includes(id)) {
      removeCard(id)
    } else {
      addCard(id)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Edition toggles */}
      {editionsData.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {editionsData.map((ed) => {
            const isBase = ed.slug === 'base'
            const isActive = activeEditionIds.includes(ed.id)
            return (
              <button
                key={ed.id}
                type="button"
                onClick={isBase ? undefined : () => toggleEdition(ed.id)}
                // disabled={isBase}
                className={cn(
                  'btn btn-xs sm:btn-sm',
                  isActive ? 'btn-primary' : 'btn-outline',
                  isBase && 'cursor-not-allowed'
                )}
              >
                {ed.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Hand size indicator */}
      <HandSizeIndicator
        maxSelected={maxSelected}
        selectedCardCount={cappedHandCount}
        hasCards={selectedCardIds.length > 0}
        clearHand={clearHand}
        playerCount={playerCount}
        setPlayerCount={setPlayerCount}
      />

      {/* Card picker */}
      {cardsQuery.isPending ? (
        <span className="loading loading-spinner" />
      ) : allCards.length > 0 ? (
        <CardPicker
          cards={allCards}
          selectedIds={selectedCardIds}
          onToggle={handleToggle}
          maxSelected={maxSelected}
          compact
        />
      ) : null}

      {/* Action card configuration */}
      {handCards.length > 0 && (
        <ActionPanel
          handCards={handCards}
          allCards={allCards}
          actionConfigs={actionConfigs}
          onSetConfig={setActionConfig}
        />
      )}
    </div>
  )
}
