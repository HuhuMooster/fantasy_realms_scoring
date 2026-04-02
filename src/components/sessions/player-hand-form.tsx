import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { ActionPanel } from '@/components/calculator/action-panel'
import { CardPicker } from '@/components/cards/card-picker'
import { Button } from '@/components/ui/button'
import { MutationError } from '@/components/ui/mutation-error'
import type { TActionConfig } from '@/lib/calculator/actions'
import { cardsQueryOptions } from '@/lib/cards/queries'
import { scoreQueryOptions } from '@/lib/scoring/queries'
import type { TScoreResult } from '@/lib/scoring/types'
import { sessionQueryOptions, submitHandMutationOptions } from '@/lib/sessions/queries'
import { calcMaxHand } from '@/lib/stores/calculatorStore'

interface IPlayerHandFormProps {
  sessionId: string
  playerId: string
  nickname: string
  editionIds: string[]
  initialCardIds: string[]
  initialActionConfigs?: Record<string, TActionConfig>
  excludedCardIds?: string[]
  onSelectionChange?: (cardIds: string[]) => void
  onActionConfigsChange?: (configs: Record<string, TActionConfig>) => void
  onScoreResult?: (result: TScoreResult | undefined) => void
}

export function PlayerHandForm({
  sessionId,
  playerId,
  nickname,
  editionIds,
  initialCardIds,
  initialActionConfigs = {},
  excludedCardIds = [],
  onSelectionChange,
  onActionConfigsChange,
  onScoreResult,
}: IPlayerHandFormProps) {
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<string[]>(initialCardIds)
  const [actionConfigs, setActionConfigs] =
    useState<Record<string, TActionConfig>>(initialActionConfigs)
  const [saved, setSaved] = useState(false)

  const editionId = editionIds.length === 1 ? editionIds[0] : undefined
  const { data: cards } = useSuspenseQuery(cardsQueryOptions({ editionId }))

  const handCards = cards.filter((c) => selectedIds.includes(c.id))
  const maxSelected = calcMaxHand(handCards.map((c) => c.name))

  const scoreQuery = useQuery({
    ...scoreQueryOptions(selectedIds, actionConfigs),
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    onScoreResult?.(scoreQuery.data)
  }, [scoreQuery.data, onScoreResult])

  const submitMutation = useMutation({
    ...submitHandMutationOptions(),
    onSuccess: () => {
      setSaved(true)
      queryClient.invalidateQueries({
        queryKey: sessionQueryOptions(sessionId).queryKey,
      })
    },
  })

  function handleToggle(id: string) {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
      onSelectionChange?.(next)
      return next
    })
    if (selectedIds.includes(id)) {
      setActionConfigs((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
    setSaved(false)
  }

  function handleSetActionConfig(cardId: string, config: TActionConfig | null) {
    setActionConfigs((prev) => {
      const next = { ...prev }
      if (config === null) {
        delete next[cardId]
      } else {
        next[cardId] = config
      }
      onActionConfigsChange?.(next)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Live score */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-base-content/60">
          {selectedIds.length}
          {' card'}
          {selectedIds.length !== 1 ? 's' : ''}
          {' selected'}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-primary">
            {scoreQuery?.data?.totalScore ?? 0}
            {' pts'}
          </span>
        </div>
      </div>
      <Button
        onClick={() =>
          submitMutation.mutate({
            data: { sessionPlayerId: playerId, cardIds: selectedIds, actionConfigs },
          })
        }
        loading={submitMutation.isPending}
        variant={saved ? 'secondary' : 'primary'}
        className="w-full"
        size="sm"
      >
        {saved ? 'Saved' : `Save ${nickname}'s hand`}
      </Button>

      {/* Card picker */}
      <CardPicker
        cards={cards}
        selectedIds={selectedIds}
        onToggle={handleToggle}
        maxSelected={maxSelected}
        compact
        excludedIds={excludedCardIds}
        listClassName="max-h-[33dvh] lg:max-h-[45dvh]"
      />

      {/* Action card configuration */}
      {handCards.length > 0 && (
        <ActionPanel
          handCards={handCards}
          allCards={cards}
          actionConfigs={actionConfigs}
          onSetConfig={handleSetActionConfig}
        />
      )}

      <MutationError mutation={submitMutation} fallback="Failed to save" />
    </div>
  )
}
