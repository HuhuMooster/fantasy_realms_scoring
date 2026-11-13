import { describe, expect, it } from 'vitest'

import { matchCards } from '@/lib/recognition/matchCards'

const cards = [
  { id: 'queen', name: 'Queen' },
  { id: 'king', name: 'King' },
  { id: 'unicorn', name: 'Unicorn' },
]

const box = (text: string, confidence = 0.95) => ({ text, confidence })

describe('matchCards', () => {
  it('matches an OCR line that is exactly a card name', () => {
    expect(matchCards([box('UNICORN')], cards).matches).toEqual([
      { cardId: 'unicorn', confidence: 0.95 },
    ])
  })

  it('tolerates OCR misreads, casing and whitespace', () => {
    const { matches } = matchCards([box('  UNlC0RN ', 1)], cards)
    expect(matches.map((m) => m.cardId)).toEqual(['unicorn'])
    // 2 of 7 chars wrong (l->i, 0->o) after normalizing case
    expect(matches[0].confidence).toBeCloseTo(5 / 7)
  })

  it('does not match rules text that mentions a card, reports it as unmatched', () => {
    const result = matchCards([box('QUEEN'), box('+20 with Queen'), box('7')], cards)
    expect(result.matches.map((m) => m.cardId)).toEqual(['queen'])
    expect(result.unmatched).toEqual(['+20 with Queen', '7'])
  })

  it('joins a title the OCR split over two lines', () => {
    const cards = [{ id: 'staff', name: 'Staff of Transmutation' }]
    // halves need not be adjacent in OCR output, nor in reading order
    const result = matchCards([box('TRANSMUTATION'), box('7'), box('STAFFOF')], cards)
    expect(result.matches.map((m) => m.cardId)).toEqual(['staff'])
    expect(result.unmatched).toEqual(['7'])
  })

  it('matches an edition variant by the name printed on the card', () => {
    const cards = [{ id: 'ch-bell', name: 'Bell Tower (Cursed Hoard)' }]
    expect(matchCards([box('BELL TOWER', 1)], cards).matches).toEqual([
      { cardId: 'ch-bell', confidence: 1 },
    ])
  })

  it('reports a card read twice once, with the higher confidence', () => {
    const { matches } = matchCards([box('KING', 0.5), box('KING', 0.9)], cards)
    expect(matches).toEqual([{ cardId: 'king', confidence: 0.9 }])
  })
})
