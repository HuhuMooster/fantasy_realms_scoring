import { describe, expect, it } from 'vitest'

import { dropReplacedCards } from '@/lib/calculator/actions'

describe('dropReplacedCards', () => {
  it('hides base cards only when their Cursed Hoard replacement is present', () => {
    const names = ['Bell Tower', 'Bell Tower (Cursed Hoard)', 'Rangers', 'Unicorn']
    const out = dropReplacedCards(names.map((name) => ({ name }))).map((c) => c.name)
    expect(out).toEqual(['Bell Tower (Cursed Hoard)', 'Rangers', 'Unicorn'])
  })
})
