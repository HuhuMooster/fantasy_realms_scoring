import { ALL_SUITS } from '@/components/cards/suit-badge'
import type { TActionConfig } from '@/lib/calculator/actions'
import {
  IMPERSONATOR_DECK_SUITS,
  ISLAND_TARGET_SUITS,
  PHOENIX_NAMES,
  getActionType,
} from '@/lib/calculator/actions'
import { formatSuitName } from '@/lib/utils'
import type { ICard } from '@/types/cards'

interface IActionPanelProps {
  handCards: ICard[]
  allCards: ICard[]
  actionConfigs: Record<string, TActionConfig>
  onSetConfig: (cardId: string, config: TActionConfig | null) => void
}

function Row({
  label,
  verb,
  children,
}: {
  label: string
  verb: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
      <span className="font-medium shrink-0">{label}</span>
      <span className="text-base-content/50 shrink-0">{verb}</span>
      {children}
    </div>
  )
}

function TargetSelectRow({
  label,
  verb,
  targets,
  value,
  onSelect,
  renderOption,
}: {
  label: string
  verb: string
  targets: ICard[]
  value: string
  onSelect: (id: string | null) => void
  renderOption?: (t: ICard) => React.ReactNode
}) {
  return (
    <Row label={label} verb={verb}>
      <select
        className="select select-xs select-bordered flex-1"
        value={value}
        onChange={(e) => onSelect(e.target.value || null)}
      >
        <option value="">{'-- pick card --'}</option>
        {targets.map((t) => (
          <option key={t.id} value={t.id}>
            {renderOption ? renderOption(t) : t.name}
          </option>
        ))}
      </select>
    </Row>
  )
}

function ImpersonateDeckRow({
  card,
  allCards,
  config,
  onSetConfig,
}: {
  card: ICard
  allCards: ICard[]
  config: TActionConfig | undefined
  onSetConfig: (cardId: string, config: TActionConfig | null) => void
}) {
  const allowedSuits = IMPERSONATOR_DECK_SUITS[card.name] ?? []
  const targets = allCards
    .filter((c) => allowedSuits.includes(c.suit) && c.id !== card.id)
    .sort((a, b) => a.suit.localeCompare(b.suit) || a.name.localeCompare(b.name))

  return (
    <TargetSelectRow
      label={card.name}
      verb="impersonates"
      targets={targets}
      value={config?.type === 'impersonate_deck' ? config.targetCardId : ''}
      onSelect={(id) =>
        onSetConfig(card.id, id ? { type: 'impersonate_deck', targetCardId: id } : null)
      }
      renderOption={(t) => `${t.name} (${t.suit})`}
    />
  )
}

function ImpersonateHandRow({
  card,
  handCards,
  config,
  onSetConfig,
}: {
  card: ICard
  handCards: ICard[]
  config: TActionConfig | undefined
  onSetConfig: (cardId: string, config: TActionConfig | null) => void
}) {
  const targets = handCards.filter((c) => c.id !== card.id)

  return (
    <TargetSelectRow
      label={card.name}
      verb="copies"
      targets={targets}
      value={config?.type === 'impersonate_hand' ? config.targetCardId : ''}
      onSelect={(id) =>
        onSetConfig(card.id, id ? { type: 'impersonate_hand', targetCardId: id } : null)
      }
    />
  )
}

function BookOfChangesRow({
  card,
  handCards,
  config,
  onSetConfig,
}: {
  card: ICard
  handCards: ICard[]
  config: TActionConfig | undefined
  onSetConfig: (cardId: string, config: TActionConfig | null) => void
}) {
  const bocConfig = config?.type === 'book_of_changes' ? config : null
  const targets = handCards.filter((c) => c.id !== card.id)

  return (
    <div className="flex flex-wrap items-center gap-1 text-xs sm:text-sm">
      <span className="font-medium shrink-0">{card.name}</span>
      <span className="text-base-content/50 shrink-0">{'changes suit of'}</span>
      <select
        className="select select-xs select-bordered w-32"
        value={bocConfig?.targetCardId ?? ''}
        onChange={(e) => {
          if (!e.target.value) {
            onSetConfig(card.id, null)
          } else {
            onSetConfig(card.id, {
              type: 'book_of_changes',
              targetCardId: e.target.value,
              newSuit: bocConfig?.newSuit ?? '',
            })
          }
        }}
      >
        <option value="">{'-- card --'}</option>
        {targets.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      {bocConfig?.targetCardId && (
        <>
          <span className="text-base-content/50 shrink-0">{'to'}</span>
          <select
            className="select select-xs select-bordered w-22"
            value={bocConfig.newSuit}
            onChange={(e) =>
              onSetConfig(card.id, {
                type: 'book_of_changes',
                targetCardId: bocConfig.targetCardId,
                newSuit: e.target.value,
              })
            }
          >
            <option value="">{'-- suit --'}</option>
            {ALL_SUITS.map((s) => (
              <option key={s} value={s}>
                {formatSuitName(s)}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  )
}

function IslandRow({
  card,
  handCards,
  config,
  onSetConfig,
}: {
  card: ICard
  handCards: ICard[]
  config: TActionConfig | undefined
  onSetConfig: (cardId: string, config: TActionConfig | null) => void
}) {
  const targets = handCards.filter(
    (c) =>
      c.id !== card.id && (ISLAND_TARGET_SUITS.has(c.suit) || PHOENIX_NAMES.has(c.name))
  )

  return (
    <TargetSelectRow
      label={card.name}
      verb="clears penalty of"
      targets={targets}
      value={config?.type === 'island' ? config.targetCardId : ''}
      onSelect={(id) =>
        onSetConfig(card.id, id ? { type: 'island', targetCardId: id } : null)
      }
    />
  )
}

function AngelRow({
  card,
  handCards,
  config,
  onSetConfig,
}: {
  card: ICard
  handCards: ICard[]
  config: TActionConfig | undefined
  onSetConfig: (cardId: string, config: TActionConfig | null) => void
}) {
  const targets = handCards.filter((c) => c.id !== card.id)

  return (
    <TargetSelectRow
      label={card.name}
      verb="protects"
      targets={targets}
      value={config?.type === 'angel' ? config.targetCardId : ''}
      onSelect={(id) =>
        onSetConfig(card.id, id ? { type: 'angel', targetCardId: id } : null)
      }
    />
  )
}

export function ActionPanel({
  handCards,
  allCards,
  actionConfigs,
  onSetConfig,
}: IActionPanelProps) {
  const actionCards = handCards.filter((c) => {
    const t = getActionType(c.name)
    return t !== null && t !== 'extra_card'
  })

  if (actionCards.length === 0) return null

  return (
    <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-base-300">
      <h3 className="text-xs sm:text-sm font-semibold text-base-content/60 uppercase tracking-wide">
        {'Action Cards'}
      </h3>
      {actionCards.map((card) => {
        const actionType = getActionType(card.name)!
        const config = actionConfigs[card.id]

        if (actionType === 'impersonate_deck')
          return (
            <ImpersonateDeckRow
              key={card.id}
              card={card}
              allCards={allCards}
              config={config}
              onSetConfig={onSetConfig}
            />
          )

        if (actionType === 'impersonate_hand')
          return (
            <ImpersonateHandRow
              key={card.id}
              card={card}
              handCards={handCards}
              config={config}
              onSetConfig={onSetConfig}
            />
          )

        if (actionType === 'book_of_changes')
          return (
            <BookOfChangesRow
              key={card.id}
              card={card}
              handCards={handCards}
              config={config}
              onSetConfig={onSetConfig}
            />
          )

        if (actionType === 'island')
          return (
            <IslandRow
              key={card.id}
              card={card}
              handCards={handCards}
              config={config}
              onSetConfig={onSetConfig}
            />
          )

        if (actionType === 'angel')
          return (
            <AngelRow
              key={card.id}
              card={card}
              handCards={handCards}
              config={config}
              onSetConfig={onSetConfig}
            />
          )

        return null
      })}
    </div>
  )
}
