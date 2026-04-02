import { PHOENIX_NAMES } from '@/lib/calculator/actions'
import { buildBlankedSet } from '@/lib/scoring/phases/blanking'
import { computePenaltyClearedIds } from '@/lib/scoring/phases/penaltyClearing'
import { evaluateCondition, suitMatches } from '@/lib/scoring/rules'
import type { TCardData, TCardScoreDetail, TScoreResult } from '@/lib/scoring/types'

export function scoreHand(hand: TCardData[]): TScoreResult {
  const penaltyClearedIds = computePenaltyClearedIds(hand)
  const blanked = buildBlankedSet(hand, penaltyClearedIds)

  const perCard: TCardScoreDetail[] = []

  for (const card of hand) {
    if (blanked.has(card.id)) {
      perCard.push({
        cardId: card.id,
        name: card.name,
        suit: card.suit,
        basePower: card.basePower,
        bonus: 0,
        penalty: 0,
        net: 0,
        blanked: true,
      })
      continue
    }

    const cardPenaltyCleared = penaltyClearedIds.has(card.id)
    let bonus = 0
    let penalty = 0

    for (const clause of card.bonusRule) {
      if (!evaluateCondition(clause.condition, hand, blanked)) continue

      for (const effect of clause.effects) {
        switch (effect.type) {
          // ---- flat ----
          case 'BONUS_FLAT':
            bonus += effect.amount
            break

          case 'PENALTY_FLAT':
            if (!cardPenaltyCleared) penalty += effect.amount
            break

          // ---- per-suit ----
          case 'BONUS_PER': {
            const count = hand.filter(
              (c) =>
                !blanked.has(c.id) &&
                suitMatches(c, effect.suit) &&
                (effect.includeSelf || c.id !== card.id)
            ).length
            bonus += count * effect.amount
            break
          }

          case 'PENALTY_PER': {
            if (!cardPenaltyCleared) {
              const count = hand.filter(
                (c) =>
                  !blanked.has(c.id) &&
                  suitMatches(c, effect.suit) &&
                  (!effect.excludeSelf || c.id !== card.id)
              ).length
              penalty += count * effect.amount
            }
            break
          }

          // ---- strength-based ----
          case 'BONUS_SUM_SUIT_STRENGTH': {
            const sum = hand
              .filter((c) => !blanked.has(c.id) && suitMatches(c, effect.suit))
              .reduce((acc, c) => acc + c.basePower, 0)
            bonus += sum
            break
          }

          case 'BONUS_HIGHEST_SUIT_STRENGTH': {
            const nonBlanked = hand.filter((c) => !blanked.has(c.id))
            let max = 0
            for (const c of nonBlanked) {
              const inSuits = effect.suits.some((s) => suitMatches(c, s))
              const inNames = effect.alsoNames?.includes(c.name) ?? false
              if ((inSuits || inNames) && c.basePower > max) {
                max = c.basePower
              }
            }
            bonus += max
            break
          }

          // ---- special algorithmic ----
          case 'BONUS_WORLD_TREE': {
            const nonBlanked = hand.filter((c) => !blanked.has(c.id))
            const suits = new Set<string>()
            let worldBonus = effect.amount
            for (const c of nonBlanked) {
              if (PHOENIX_NAMES.has(c.name)) {
                if (suits.has('flame') || suits.has('weather')) {
                  worldBonus = 0
                  break
                }
                suits.add('flame')
                suits.add('weather')
              } else {
                if (suits.has(c.suit)) {
                  worldBonus = 0
                  break
                }
                suits.add(c.suit)
              }
            }
            bonus += worldBonus
            break
          }

          case 'BONUS_COLLECTOR': {
            const nonBlanked = hand.filter((c) => !blanked.has(c.id))
            const bySuit: Record<string, Set<string>> = {}
            for (const c of nonBlanked) {
              const addTo = (s: string) => {
                if (!bySuit[s]) bySuit[s] = new Set()
                bySuit[s].add(c.name)
              }
              if (PHOENIX_NAMES.has(c.name)) {
                addTo('flame')
                addTo('weather')
              }
              addTo(c.suit)
            }
            let collBonus = 0
            for (const suitCards of Object.values(bySuit)) {
              const n = suitCards.size
              if (n === 3) collBonus += 10
              else if (n === 4) collBonus += 40
              else if (n >= 5) collBonus += 100
            }
            bonus += collBonus
            break
          }

          case 'BONUS_GEM_OF_ORDER': {
            const nonBlanked = hand.filter((c) => !blanked.has(c.id))
            const strengths = nonBlanked.map((c) => c.basePower).sort((a, b) => a - b)
            let gemBonus = 0
            let found = true
            while (found) {
              found = false
              let run: number[] = []
              for (const s of strengths) {
                if (run.length > 0 && s === run[run.length - 1] + 1) {
                  run.push(s)
                } else if (run.length < 3 && !run.includes(s)) {
                  run = [s]
                }
              }
              if (run.length >= 3) {
                found = true
                for (const s of run) strengths.splice(strengths.indexOf(s), 1)
                if (run.length === 3) gemBonus += 10
                else if (run.length === 4) gemBonus += 30
                else if (run.length === 5) gemBonus += 60
                else if (run.length === 6) gemBonus += 100
                else gemBonus += 150
              }
            }
            bonus += gemBonus
            break
          }

          case 'BONUS_JESTER': {
            const nonBlanked = hand.filter((c) => !blanked.has(c.id))
            const oddCount = nonBlanked.filter((c) => c.basePower % 2 !== 0).length
            if (oddCount === nonBlanked.length) {
              bonus += 50
            } else {
              bonus += Math.max(0, (oddCount - 1) * 3)
            }
            break
          }

          // ---- handled in earlier phases ----
          case 'BLANK_SUIT':
          case 'BLANK_SUIT_EXCEPT':
          case 'BLANK_CARD':
          case 'BLANK_SELF':
          case 'BLANK_DEMON':
          case 'CLEARS_SUIT_PENALTY':
          case 'CLEARS_CARD_PENALTY':
          case 'CLEARS_ALL_PENALTIES':
          case 'PROTECT_SUIT_FROM_BLANK':
            break
        }
      }
    }

    const net = card.basePower + bonus - penalty
    perCard.push({
      cardId: card.id,
      name: card.name,
      suit: card.suit,
      basePower: card.basePower,
      bonus,
      penalty,
      net,
      blanked: false,
    })
  }

  const totalScore = perCard.reduce((sum, c) => sum + c.net, 0)
  return { totalScore, perCard }
}
