import { PHOENIX_NAMES } from '@/lib/calculator/actions'
import { evaluateCondition } from '@/lib/scoring/rules'
import type { TCardData } from '@/lib/scoring/types'

// Rules:
// - Penalty-cleared cards cannot blank others and cannot self-blank.
// - PROTECT_SUIT_FROM_BLANK applies even when the protector is blanked
//   (matches official: Lich protects undead even when Lich is blanked).
// - blankedProtected flag (Angel action) prevents a card from being blanked.
// - BLANK_DEMON fires first (Demon blanks cards with unique suits).
// - All conditions are evaluated with blankedIds so suit-based checks
//   only consider non-blanked cards.

export function buildBlankedSet(
  hand: TCardData[],
  penaltyClearedIds: Set<string>
): Set<string> {
  const blanked = new Set<string>()

  // Collect suit protection from ALL cards (including blanked) - PROTECT_SUIT_FROM_BLANK
  // This is static and doesn't change during iteration.
  const protectedSuits = new Set<string>()
  for (const card of hand) {
    for (const clause of card.bonusRule) {
      // Evaluate condition against full hand (no blankedIds) since protector
      // works even when blanked - condition is typically ALWAYS.
      if (!evaluateCondition(clause.condition, hand)) continue
      for (const effect of clause.effects) {
        if (effect.type === 'PROTECT_SUIT_FROM_BLANK') {
          protectedSuits.add(effect.suit)
        }
      }
    }
  }

  // Helper: can this card be blanked?
  function canBeBlanked(card: TCardData): boolean {
    if (card.blankedProtected) return false
    if (protectedSuits.has(card.suit)) return false
    return true
  }

  // Demon blanking (happens first, before all other blanking)
  for (const card of hand) {
    if (penaltyClearedIds.has(card.id)) continue
    for (const clause of card.bonusRule) {
      if (!evaluateCondition(clause.condition, hand, blanked)) continue
      for (const effect of clause.effects) {
        if (effect.type === 'BLANK_DEMON') {
          // Count suits among non-blanked cards
          const suitCounts: Record<string, number> = {}
          for (const c of hand) {
            if (blanked.has(c.id)) continue
            suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1
            // Phoenix also counts for flame and weather
            if (PHOENIX_NAMES.has(c.name)) {
              suitCounts['flame'] = (suitCounts['flame'] || 0) + 1
              suitCounts['weather'] = (suitCounts['weather'] || 0) + 1
            }
          }
          for (const target of hand) {
            if (blanked.has(target.id)) continue
            if (target.id === card.id) continue
            if (target.suit === 'outsider') continue
            if (PHOENIX_NAMES.has(target.name) && target.name === 'Phoenix') continue
            if (!canBeBlanked(target)) continue

            // Phoenix (Promo) special handling
            if (target.name === 'Phoenix (Promo)') {
              if (
                (suitCounts[target.suit] || 0) === 1 ||
                (suitCounts['flame'] || 0) === 1 ||
                (suitCounts['weather'] || 0) === 1
              ) {
                blanked.add(target.id)
              }
            } else {
              if ((suitCounts[target.suit] || 0) === 1) {
                blanked.add(target.id)
              }
            }
          }
        }
      }
    }
  }

  // Regular blanking (fixed-point iteration)
  let changed = true
  while (changed) {
    changed = false

    for (const card of hand) {
      // Self-blanking: BLANK_SELF fires if card is non-blanked AND non-penalty-cleared.
      if (!blanked.has(card.id) && !penaltyClearedIds.has(card.id)) {
        for (const clause of card.bonusRule) {
          if (!evaluateCondition(clause.condition, hand, blanked)) continue
          for (const effect of clause.effects) {
            if (effect.type === 'BLANK_SELF' && canBeBlanked(card)) {
              blanked.add(card.id)
              changed = true
            }
          }
        }
      }

      // Blanking others: skip if this card is blanked or penalty-cleared.
      if (blanked.has(card.id)) continue
      if (penaltyClearedIds.has(card.id)) continue

      for (const clause of card.bonusRule) {
        if (!evaluateCondition(clause.condition, hand, blanked)) continue

        for (const effect of clause.effects) {
          if (effect.type === 'BLANK_SUIT') {
            for (const other of hand) {
              if (
                other.suit === effect.suit &&
                other.id !== card.id &&
                !blanked.has(other.id) &&
                canBeBlanked(other)
              ) {
                blanked.add(other.id)
                changed = true
              }
            }
          } else if (effect.type === 'BLANK_SUIT_EXCEPT') {
            for (const other of hand) {
              if (
                other.suit === effect.suit &&
                other.id !== card.id &&
                !effect.exceptNames.includes(other.name) &&
                !blanked.has(other.id) &&
                canBeBlanked(other)
              ) {
                blanked.add(other.id)
                changed = true
              }
            }
          } else if (effect.type === 'BLANK_CARD') {
            const target = hand.find((c) => c.name === effect.name)
            if (target && !blanked.has(target.id) && canBeBlanked(target)) {
              blanked.add(target.id)
              changed = true
            }
          }
        }
      }
    }
  }

  return blanked
}
