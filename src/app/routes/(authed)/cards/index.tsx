import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { CardTile } from '@/components/cards/card-tile'
import type { TSuit } from '@/components/cards/suit-badge'
import { SuitSelect } from '@/components/cards/suit-select'
import { Input } from '@/components/ui/input'
import type { cards } from '@/db/schema/cards'
import { cardsQueryOptions, editionsQueryOptions } from '@/lib/cards/queries'

type TCard = typeof cards.$inferSelect

export const Route = createFileRoute('/(authed)/cards/')({
  beforeLoad: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(editionsQueryOptions()),
      context.queryClient.prefetchQuery(cardsQueryOptions({})),
    ])
  },
  component: CardsPage,
})

function CardsPage() {
  const [q, setQ] = useState('')
  const [suit, setSuit] = useState('')
  const [editionId, setEdition] = useState('')

  const { data: editions } = useSuspenseQuery(editionsQueryOptions())

  const cardsQuery = useQuery(
    cardsQueryOptions({
      editionId: editionId || undefined,
      suit: suit || undefined,
      q: q || undefined,
    })
  )

  return (
    <div className="p-4 max-w-7xl xl:max-w-10/12 mx-auto">
      <h1 className="text-2xl font-bold mb-4">{'Card Browser'}</h1>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap mb-4 items-center">
        <div className="w-full sm:flex-1">
          <Input
            placeholder="Search by name..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <select
          className="select select-bordered select-xs sm:select-md w-full sm:w-auto"
          value={editionId}
          onChange={(e) => setEdition(e.target.value)}
        >
          <option value="">{'All editions'}</option>
          {editions.map((ed) => (
            <option key={ed.id} value={ed.id}>
              {ed.name}
            </option>
          ))}
        </select>

        <SuitSelect
          value={suit}
          onChange={setSuit}
          className="w-full sm:w-auto sm:select-md"
        />
      </div>

      {cardsQuery.isPending && (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {cardsQuery.isError && <p className="text-error">{'Failed to load cards.'}</p>}

      {cardsQuery.data && (
        <>
          <p className="text-sm text-base-content/50 mb-3">
            {cardsQuery.data.length}
            {' cards'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {cardsQuery.data.map((card: TCard) => (
              <Link key={card.id} to="/cards/$id" params={{ id: card.id }}>
                <CardTile
                  id={card.id}
                  name={card.name}
                  suit={card.suit as TSuit}
                  basePower={card.basePower}
                  description={card.description ?? undefined}
                  compact
                />
              </Link>
            ))}
            {cardsQuery.data.length === 0 && (
              <p className="col-span-full text-center text-base-content/50 py-8">
                {'No cards found.'}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
