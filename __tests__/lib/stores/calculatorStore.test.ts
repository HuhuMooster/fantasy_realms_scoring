import { describe, expect, it } from 'vitest'

import { calcMaxHand } from '@/lib/stores/calculatorStore'

describe('calcMaxHand', () => {
  it('base hand size is 7 with no Cursed Hoard suits and no extra-card card', () => {
    expect(calcMaxHand([], false)).toBe(7)
  })

  it('rises to 8 when the Cursed Hoard suits edition is active, regardless of hand contents', () => {
    expect(calcMaxHand([], true)).toBe(8)
    expect(calcMaxHand(['Mountain', 'Swamp'], true)).toBe(8)
  })

  it('rises to 8 with an extra-card card even without the Cursed Hoard suits edition', () => {
    expect(calcMaxHand(['Necromancer'], false)).toBe(8)
    expect(calcMaxHand(['Leprechaun'], false)).toBe(8)
    expect(calcMaxHand(['Portal'], false)).toBe(8)
    expect(calcMaxHand(['Genie'], false)).toBe(8)
  })

  it('rises to 9 with the Cursed Hoard suits edition active AND an extra-card card in hand', () => {
    expect(calcMaxHand(['Necromancer'], true)).toBe(9)
    expect(calcMaxHand(['Necromancer (Cursed Hoard)'], true)).toBe(9)
  })

  it('multiple extra-card cards still only add 1', () => {
    expect(calcMaxHand(['Necromancer', 'Genie', 'Leprechaun'], true)).toBe(9)
  })
})
