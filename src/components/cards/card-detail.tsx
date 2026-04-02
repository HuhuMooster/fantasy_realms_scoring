import { highlightDescription } from '@/components/cards/highlight-description'
import { getSuitColors } from '@/components/cards/suit-badge'
import { formatSuitName } from '@/lib/utils'

interface ICardDetailProps {
  id: string
  name: string
  suit: string
  basePower: number
  description: string
}

export function CardDetail({ name, suit, basePower, description }: ICardDetailProps) {
  const colors = getSuitColors(suit)
  const suitLabel = formatSuitName(suit)

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm shadow-primary max-w-lg ">
      <div className="card-body gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <h2 className="card-title text-2xl">{name}</h2>
          <div className="flex items-center gap-3 sm:flex-row sm:items-end sm:gap-2">
            <span
              style={{ backgroundColor: colors.bg, color: colors.text }}
              className="badge badge-lg border-0 self-center"
            >
              {suitLabel}
            </span>
            <span className="text-3xl font-bold text-base-content/70">{basePower}</span>
          </div>
        </div>

        <p className="text-base-content/70 text-sm leading-relaxed">
          {highlightDescription(description)}
        </p>
      </div>
    </div>
  )
}
