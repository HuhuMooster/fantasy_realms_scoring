import { queryOptions } from '@tanstack/react-query'

import { calculateScore } from '@/app/server/scoring'
import type { TActionConfig } from '@/lib/calculator/actions'

export const scoreQueryOptions = (
  cardIds: string[],
  actionConfigs?: Record<string, TActionConfig>
) =>
  queryOptions({
    queryKey: ['score', cardIds, actionConfigs],
    queryFn: () => calculateScore({ data: { cardIds, actionConfigs } }),
    enabled: cardIds.length > 0,
  })
