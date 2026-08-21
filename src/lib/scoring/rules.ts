import { PHOENIX_NAMES } from '@/lib/calculator/actions'
import type { TCardData, TCondition } from '@/lib/scoring/types'

export function suitMatches(card: TCardData, suit: string): boolean {
  if (card.suit === suit) return true
  if (PHOENIX_NAMES.has(card.name) && (suit === 'weather' || suit === 'flame'))
    return true
  return false
}

/**
 * Returns true when the condition holds for the given hand of cards.
 *
 * When blankedIds is provided:
 * - HAS_CARD still checks ALL cards (a blanked card is still physically present)
 * - HAS_SUIT / SUIT_COUNT_GTE / MULTI_SUIT_COUNT_EQ check non-blanked only
 *
 * This matches the official Fantasy Realms behavior where card-name presence
 * is always detectable (e.g. Rangers clears army even when blanked) but
 * suit-based checks only count active (non-blanked) cards.
 */
export function evaluateCondition(
  condition: TCondition,
  hand: TCardData[],
  blankedIds?: Set<string>
): boolean {
  const activeHand = blankedIds ? hand.filter((c) => !blankedIds.has(c.id)) : hand

  switch (condition.type) {
    case 'ALWAYS':
      return true

    case 'HAS_CARD':
      // Check ALL cards (including blanked) - matches containsId(id, true)
      return hand.some((c) => c.name === condition.name)

    case 'HAS_SUIT':
      return activeHand.some((c) => suitMatches(c, condition.suit))

    case 'SUIT_COUNT_GTE':
      return (
        activeHand.filter((c) => suitMatches(c, condition.suit)).length >= condition.n
      )

    case 'MULTI_SUIT_COUNT_EQ':
      return (
        activeHand.filter((c) => condition.suits.some((s) => suitMatches(c, s)))
          .length === condition.count
      )

    case 'NOT':
      return !evaluateCondition(condition.condition, hand, blankedIds)

    case 'AND':
      return condition.conditions.every((c) => evaluateCondition(c, hand, blankedIds))

    case 'OR':
      return condition.conditions.some((c) => evaluateCondition(c, hand, blankedIds))
  }
}

// Effect types that correspond to the official rulebook's static "this card
// carries a Penalty" flag (used by Judge). That flag isn't just "has a
// PENALTY_FLAT/PENALTY_PER effect" -- cards that only blank other cards, or
// blank themselves under some condition (e.g. Great Flood, Rainstorm, Crypt,
// Garden, Demon, Warship, Phoenix), are flagged too. Verified card-by-card
// against the official reference implementation.
const PENALTY_SIGNAL_EFFECT_TYPES = new Set([
  'PENALTY_FLAT',
  'PENALTY_PER',
  'PENALTY_IF_PLAYER_COUNT_EQ',
  'BLANK_SELF',
  'BLANK_SUIT',
  'BLANK_SUIT_EXCEPT',
  'BLANK_CARD',
  'BLANK_DEMON',
])

export function cardCarriesPenaltySignal(card: TCardData): boolean {
  return card.bonusRule.some((clause) =>
    clause.effects.some((effect) => PENALTY_SIGNAL_EFFECT_TYPES.has(effect.type))
  )
}
