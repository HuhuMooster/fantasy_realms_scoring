import { queryOptions } from '@tanstack/react-query'

import { getCard, getCards, getEditions } from '@/app/server/cards'

export const editionsQueryOptions = () =>
  queryOptions({
    queryKey: ['editions'],
    queryFn: () => getEditions(),
  })

export const cardsQueryOptions = (filters: {
  editionId?: string
  suit?: string
  q?: string
}) =>
  queryOptions({
    queryKey: ['cards', filters],
    queryFn: () => getCards({ data: filters }),
  })

export const cardQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['card', id],
    queryFn: () => getCard({ data: { id } }),
  })
