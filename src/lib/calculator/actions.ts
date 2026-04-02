// Action card mechanics for the scoring calculator.
// Based on the official Fantasy Realms scoring logic.

// ----------------------------------------------------------------
// Which cards are action cards and what they do
// ----------------------------------------------------------------

// Cards that impersonate a card chosen from the full deck (only name+suit copied)
export const IMPERSONATOR_DECK_SUITS: Record<string, string[]> = {
  Shapeshifter: ['artifact', 'beast', 'leader', 'weapon', 'wizard'],
  'Shapeshifter (Cursed Hoard)': [
    'artifact',
    'beast',
    'building',
    'leader',
    'weapon',
    'wizard',
  ],
  Mirage: ['army', 'flame', 'flood', 'land', 'weather'],
  'Mirage (Cursed Hoard)': ['army', 'building', 'flame', 'flood', 'land', 'weather'],
}

// Doppelganger impersonates a card already in the player's hand (full copy)
export const IMPERSONATOR_HAND = new Set(['Doppelganger'])

// Book of Changes: change one hand-card's suit
export const BOOK_OF_CHANGES = new Set(['Book of Changes'])

// Island: clear the penalty of one flood/flame/Phoenix card in hand
export const ISLAND_CARDS = new Set(['Island'])

// Angel: protect one card in hand from being blanked
export const ANGEL_CARDS = new Set(['Angel'])

// Extra-card cards: each one in hand increases max hand size by 1
export const EXTRA_CARD_NAMES = new Set([
  'Necromancer',
  'Necromancer (Cursed Hoard)',
  'Leprechaun',
  'Portal',
  'Genie',
])

// Suits a flood/flame/Phoenix card can have (for Island target validation)
export const ISLAND_TARGET_SUITS = new Set(['flood', 'flame'])
export const PHOENIX_NAMES = new Set(['Phoenix', 'Phoenix (Promo)'])

export type TActionType =
  | 'impersonate_deck'
  | 'impersonate_hand'
  | 'book_of_changes'
  | 'island'
  | 'angel'
  | 'extra_card'

export function getActionType(cardName: string): TActionType | null {
  if (cardName in IMPERSONATOR_DECK_SUITS) return 'impersonate_deck'
  if (IMPERSONATOR_HAND.has(cardName)) return 'impersonate_hand'
  if (BOOK_OF_CHANGES.has(cardName)) return 'book_of_changes'
  if (ISLAND_CARDS.has(cardName)) return 'island'
  if (ANGEL_CARDS.has(cardName)) return 'angel'
  if (EXTRA_CARD_NAMES.has(cardName)) return 'extra_card'
  return null
}

// ----------------------------------------------------------------
// Per-card action configuration (stored in calculator store)
// ----------------------------------------------------------------

export type TImpersonateConfig = {
  type: 'impersonate_deck' | 'impersonate_hand'
  targetCardId: string
}

export type TBookOfChangesConfig = {
  type: 'book_of_changes'
  targetCardId: string
  newSuit: string
}

export type TIslandConfig = {
  type: 'island'
  targetCardId: string
}

export type TAngelConfig = {
  type: 'angel'
  targetCardId: string
}

export type TActionConfig =
  | TImpersonateConfig
  | TBookOfChangesConfig
  | TIslandConfig
  | TAngelConfig
