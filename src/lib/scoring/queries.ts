import { queryOptions } from '@tanstack/react-query'

import { calculateScore } from '@/app/server/scoring'
import type { TActionConfig } from '@/lib/calculator/actions'

interface IScoreQueryOptions {
  actionConfigs?: Record<string, TActionConfig>
  discardCardIds?: string[]
  playerCount?: number
}

export const scoreQueryOptions = (
  cardIds: string[],
  options: IScoreQueryOptions = {}
) =>
  queryOptions({
    queryKey: ['score', cardIds, options],
    queryFn: () => calculateScore({ data: { cardIds, ...options } }),
    enabled: cardIds.length > 0,
  })
