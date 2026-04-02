import { evaluateCondition, suitMatches } from '@/lib/scoring/rules'
import type { TCardData } from '@/lib/scoring/types'

// In the official game, penalty clearing happens BEFORE blanking.
// A penalty-cleared card:
// - Has its penalty score zeroed
// - Cannot blank other cards
// - Cannot self-blank (blankedIf suppressed)
// This runs against the FULL hand (no blanking has occurred yet).

export function computePenaltyClearedIds(hand: TCardData[]): Set<string> {
  const cleared = new Set<string>()

  // Cards with the penaltiesCleared flag (set by Island action pre-processing)
  for (const card of hand) {
    if (card.penaltiesCleared) cleared.add(card.id)
  }

  // Cards that clear other cards' penalties via effects
  for (const card of hand) {
    for (const clause of card.bonusRule) {
      if (!evaluateCondition(clause.condition, hand)) continue
      for (const effect of clause.effects) {
        if (effect.type === 'CLEARS_ALL_PENALTIES') {
          for (const c of hand) cleared.add(c.id)
        } else if (effect.type === 'CLEARS_SUIT_PENALTY') {
          for (const c of hand) {
            if (suitMatches(c, effect.suit)) cleared.add(c.id)
          }
        } else if (effect.type === 'CLEARS_CARD_PENALTY') {
          for (const c of hand) {
            if (c.name === effect.name) cleared.add(c.id)
          }
        }
      }
    }
  }

  return cleared
}
