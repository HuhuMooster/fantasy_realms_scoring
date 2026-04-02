import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { CardDetail } from '@/components/cards/card-detail'
import { cardQueryOptions } from '@/lib/cards/queries'

export const Route = createFileRoute('/(authed)/cards/$id')({
  beforeLoad: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(cardQueryOptions(params.id))
  },
  component: CardDetailPage,
})

function CardDetailPage() {
  const { id } = Route.useParams()
  const { data: card } = useSuspenseQuery(cardQueryOptions(id))

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link to="/cards" className="btn btn-ghost btn-sm mb-4">
        {'Back to cards'}
      </Link>

      {card && (
        <CardDetail
          id={card.id}
          name={card.name}
          suit={card.suit}
          basePower={card.basePower}
          description={card.description}
        />
      )}
    </div>
  )
}
