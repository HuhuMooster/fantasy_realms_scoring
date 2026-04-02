import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { ActionPanel } from '@/components/calculator/action-panel'
import { CardPicker } from '@/components/cards/card-picker'
import { cardsQueryOptions, editionsQueryOptions } from '@/lib/cards/queries'
import { calcMaxHand, useCalculatorStore } from '@/lib/stores/calculatorStore'
import { cn } from '@/lib/utils'

interface IHandSizeIndicatorProps {
  maxSelected: number
  selectedCardCount: number
  clearHand: () => void
}

function HandSizeIndicator({
  maxSelected,
  selectedCardCount,
  clearHand,
}: IHandSizeIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-base-content/60">
        {'Hand: '}
        {selectedCardCount}
        {' / '}
        {maxSelected}
        {' cards'}
      </span>
      <button
        type="button"
        onClick={clearHand}
        disabled={selectedCardCount < 1}
        className="btn btn-xs text-error"
      >
        {'Clear hand'}
      </button>
    </div>
  )
}

export function HandBuilder() {
  const {
    activeEditionIds,
    selectedCardIds,
    actionConfigs,
    toggleEdition,
    addCard,
    removeCard,
    clearHand,
    setActionConfig,
  } = useCalculatorStore()

  const { data: editionsData } = useSuspenseQuery(editionsQueryOptions())

  const baseEdition = editionsData.find((ed) => ed.slug === 'base')

  useEffect(() => {
    if (baseEdition?.id && !activeEditionIds.includes(baseEdition.id)) {
      toggleEdition(baseEdition.id)
    }
  }, [baseEdition, activeEditionIds, toggleEdition])

  const editionId = activeEditionIds.length === 1 ? activeEditionIds[0] : undefined

  const cardsQuery = useQuery(cardsQueryOptions({ editionId }))

  const allCards = cardsQuery.data ?? []
  const handCards = allCards.filter((c) => selectedCardIds.includes(c.id))
  const maxSelected = calcMaxHand(handCards.map((c) => c.name))

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
        selectedCardCount={selectedCardIds.length}
        clearHand={clearHand}
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
