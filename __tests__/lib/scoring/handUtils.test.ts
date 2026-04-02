import { describe, expect, it } from 'vitest'

import { applyActionConfigs, buildHand } from '@/lib/scoring/handUtils'
import type { TCardData } from '@/lib/scoring/types'

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

type TRow = {
  id: string
  name: string
  suit: string
  basePower: number
  bonusRule: unknown
}

function row(id: string, name: string, suit: string, basePower = 10): TRow {
  return { id, name, suit, basePower, bonusRule: [] }
}

function hand(rows: TRow[]): TCardData[] {
  return buildHand(rows)
}

// ---------------------------------------------------------------------------
// buildHand
// ---------------------------------------------------------------------------
describe('buildHand', () => {
  it('returns an empty array for empty input', () => {
    expect(buildHand([])).toEqual([])
  })

  it('maps every field correctly', () => {
    const rows = [row('c1', 'Dragon', 'beast', 20)]
    const result = buildHand(rows)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: 'c1',
      name: 'Dragon',
      suit: 'beast',
      basePower: 20,
      bonusRule: [],
    })
  })

  it('preserves null bonusRule as-is', () => {
    const rows = [{ id: 'c1', name: 'X', suit: 'wild', basePower: 5, bonusRule: null }]
    expect(buildHand(rows)[0].bonusRule).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// applyActionConfigs
// ---------------------------------------------------------------------------
describe('applyActionConfigs', () => {
  const r1 = row('c1', 'Shapeshifter', 'wild', 5)
  const r2 = row('c2', 'Dragon', 'beast', 30)
  const r3 = row('c3', 'Shield', 'artifact', 8)
  const r4 = row('c4', 'Swamp', 'land', 7)
  const r5 = row('c5', 'DeckCard', 'flame', 15)

  const baseRows = [r1, r2, r3, r4]
  const rowMap = Object.fromEntries([r1, r2, r3, r4, r5].map((r) => [r.id, r]))

  it('impersonate_deck: action card takes name and suit of a rowMap target not in hand', () => {
    const result = applyActionConfigs(hand(baseRows), rowMap, {
      c1: { type: 'impersonate_deck', targetCardId: 'c5' },
    })
    const shapeshifter = result.find((c) => c.id === 'c1')!
    expect(shapeshifter.name).toBe('DeckCard')
    expect(shapeshifter.suit).toBe('flame')
    // basePower unchanged
    expect(shapeshifter.basePower).toBe(5)
  })

  it('impersonate_hand: action card takes name, suit, basePower, bonusRule of another hand card', () => {
    const result = applyActionConfigs(hand(baseRows), rowMap, {
      c1: { type: 'impersonate_hand', targetCardId: 'c2' },
    })
    const shapeshifter = result.find((c) => c.id === 'c1')!
    expect(shapeshifter.name).toBe('Dragon')
    expect(shapeshifter.suit).toBe('beast')
    expect(shapeshifter.basePower).toBe(30)
  })

  it('book_of_changes: changes target card suit; action card is unchanged', () => {
    const result = applyActionConfigs(hand(baseRows), rowMap, {
      c1: { type: 'book_of_changes', targetCardId: 'c2', newSuit: 'flame' },
    })
    const dragon = result.find((c) => c.id === 'c2')!
    expect(dragon.suit).toBe('flame')
    const shapeshifter = result.find((c) => c.id === 'c1')!
    expect(shapeshifter.suit).toBe('wild') // unchanged
  })

  it('island: sets penaltiesCleared on target', () => {
    const result = applyActionConfigs(hand(baseRows), rowMap, {
      c4: { type: 'island', targetCardId: 'c2' },
    })
    const dragon = result.find((c) => c.id === 'c2')!
    expect(dragon.penaltiesCleared).toBe(true)
  })

  it('angel: sets blankedProtected on target', () => {
    const result = applyActionConfigs(hand(baseRows), rowMap, {
      c4: { type: 'angel', targetCardId: 'c2' },
    })
    const dragon = result.find((c) => c.id === 'c2')!
    expect(dragon.blankedProtected).toBe(true)
  })

  it('unknown action card id (not in hand) is a no-op', () => {
    const original = hand(baseRows)
    const result = applyActionConfigs(original, rowMap, {
      nonexistent: { type: 'island', targetCardId: 'c2' },
    })
    expect(result.find((c) => c.id === 'c2')!.penaltiesCleared).toBeUndefined()
  })

  it('unknown target card id is a no-op', () => {
    const original = hand(baseRows)
    const result = applyActionConfigs(original, rowMap, {
      c1: { type: 'impersonate_deck', targetCardId: 'does-not-exist' },
    })
    const shapeshifter = result.find((c) => c.id === 'c1')!
    // name/suit should be unchanged from original
    expect(shapeshifter.name).toBe('Shapeshifter')
  })

  it('multiple configs all apply', () => {
    const result = applyActionConfigs(hand(baseRows), rowMap, {
      c1: { type: 'book_of_changes', targetCardId: 'c2', newSuit: 'flame' },
      c3: { type: 'island', targetCardId: 'c4' },
    })
    expect(result.find((c) => c.id === 'c2')!.suit).toBe('flame')
    expect(result.find((c) => c.id === 'c4')!.penaltiesCleared).toBe(true)
  })

  it('does not mutate the original hand array', () => {
    const original = hand(baseRows)
    const originalNames = original.map((c) => c.name)
    applyActionConfigs(original, rowMap, {
      c1: { type: 'impersonate_hand', targetCardId: 'c2' },
    })
    expect(original.map((c) => c.name)).toEqual(originalNames)
  })
})
