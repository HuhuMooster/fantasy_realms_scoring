import { describe, expect, it } from 'vitest'

import { formatDate, formatSuitName } from '@/lib/utils'

describe('formatDate', () => {
  it('formats a Date object to a readable string containing the year', () => {
    const d = new Date('2024-03-15T00:00:00Z')
    const result = formatDate(d)
    expect(result).toContain('2024')
  })

  it('produces the same output for an ISO string as for the equivalent Date object', () => {
    const iso = '2024-06-01T00:00:00.000Z'
    expect(formatDate(iso)).toBe(formatDate(new Date(iso)))
  })

  it('does not throw for the Unix epoch', () => {
    expect(() => formatDate(new Date(0))).not.toThrow()
  })

  it('returns a non-empty string', () => {
    expect(formatDate('2023-01-01')).toBeTruthy()
  })
})

describe('formatSuitName', () => {
  it('converts hyphenated suit to title-cased words', () => {
    expect(formatSuitName('cursed-item')).toBe('Cursed Item')
  })

  it('capitalises a single-word suit', () => {
    expect(formatSuitName('flame')).toBe('Flame')
  })

  it('handles wild correctly', () => {
    expect(formatSuitName('wild')).toBe('Wild')
  })
})
