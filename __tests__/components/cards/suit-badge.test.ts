import { describe, expect, it } from 'vitest'

import { getSuitColors, getSuitShortLabel } from '@/components/cards/suit-badge'

describe('getSuitColors', () => {
  it('returns correct colors for a known suit', () => {
    const colors = getSuitColors('flame')
    expect(colors.bg).toBe('#b44347')
    expect(colors.text).toBe('#ffffff')
  })

  it('returns fallback colors for an unknown suit', () => {
    const colors = getSuitColors('unknown-suit')
    expect(colors.bg).toBe('#888888')
    expect(colors.text).toBe('#ffffff')
  })

  it('handles all defined suits without returning fallback', () => {
    const knownSuits = [
      'army',
      'artifact',
      'beast',
      'building',
      'cursed-item',
      'flame',
      'flood',
      'land',
      'leader',
      'outsider',
      'undead',
      'weapon',
      'weather',
      'wild',
      'wizard',
    ]
    for (const suit of knownSuits) {
      expect(getSuitColors(suit).bg).not.toBe('#888888')
    }
  })
})

describe('getSuitShortLabel', () => {
  it('returns first word capitalised for hyphenated suit', () => {
    expect(getSuitShortLabel('cursed-item')).toBe('Cursed')
  })

  it('capitalises a single-word suit', () => {
    expect(getSuitShortLabel('flame')).toBe('Flame')
  })

  it('capitalises wild', () => {
    expect(getSuitShortLabel('wild')).toBe('Wild')
  })
})
