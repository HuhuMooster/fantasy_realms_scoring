// BonusRule DSL types for Fantasy Realms scoring engine.

// ------------------------------------------------------------------
// Conditions -- evaluated against the cards currently in hand
// ------------------------------------------------------------------

export type TCondition =
  | { type: 'ALWAYS' }
  | { type: 'HAS_CARD'; name: string } // at least one card with that name
  | { type: 'HAS_SUIT'; suit: string } // at least one card of that suit
  | { type: 'SUIT_COUNT_GTE'; suit: string; n: number } // suit count >= n
  | { type: 'MULTI_SUIT_COUNT_EQ'; suits: string[]; count: number } // total across suits == count
  | { type: 'NOT'; condition: TCondition }
  | { type: 'AND'; conditions: TCondition[] }
  | { type: 'OR'; conditions: TCondition[] }

// ------------------------------------------------------------------
// Effects -- what the rule does when its condition is true
// ------------------------------------------------------------------

export type TEffect =
  | { type: 'BONUS_FLAT'; amount: number }
  | {
      type: 'BONUS_PER'
      suit: string
      amount: number
      // When true the card counts itself (default: excludes self)
      includeSelf?: boolean
    }
  | { type: 'PENALTY_FLAT'; amount: number }
  | {
      type: 'PENALTY_PER'
      suit: string
      amount: number
      // When true the card excludes itself from the count
      excludeSelf?: boolean
    }
  | { type: 'BLANK_SUIT'; suit: string } // blanks every card of suit except this card
  | { type: 'BLANK_SUIT_EXCEPT'; suit: string; exceptNames: string[] } // blanks suit, skipping named cards
  | { type: 'BLANK_CARD'; name: string } // blanks a specific card by name
  | { type: 'BLANK_SELF' } // card blanks itself when condition is met
  // --- strength-based bonuses ---
  | { type: 'BONUS_SUM_SUIT_STRENGTH'; suit: string } // Warlord/Crypt: sum suit strengths
  | { type: 'BONUS_HIGHEST_SUIT_STRENGTH'; suits: string[]; alsoNames?: string[] } // Fountain of Life
  // --- special algorithmic bonuses ---
  | { type: 'BONUS_WORLD_TREE'; amount: number } // all-different-suits bonus
  | { type: 'BONUS_COLLECTOR' } // Collector: per-suit diversity scoring
  | { type: 'BONUS_GEM_OF_ORDER' } // Gem of Order: consecutive run scoring
  | { type: 'BONUS_JESTER' } // Jester: odd-strength scoring
  // --- penalty clearing ---
  | { type: 'CLEARS_SUIT_PENALTY'; suit: string } // Mountain, Beastmaster: clear suit penalties + suppress blanking
  | { type: 'CLEARS_CARD_PENALTY'; name: string } // Cavern -> Phoenix: clear specific card's penalty
  | { type: 'CLEARS_ALL_PENALTIES' } // Protection Rune
  // --- blanking protection ---
  | { type: 'PROTECT_SUIT_FROM_BLANK'; suit: string } // Lich/Necromancer: undead can't be blanked (even if protector blanked)
  // --- special blanking ---
  | { type: 'BLANK_DEMON' } // Demon: blank cards whose suit appears only once (excl outsider/Phoenix)

// ------------------------------------------------------------------
// BonusRule -- an ordered list of condition/effect clauses
// ------------------------------------------------------------------

export type TBonusRuleClause = {
  condition: TCondition
  effects: TEffect[]
}

export type TBonusRule = TBonusRuleClause[]

// ------------------------------------------------------------------
// Runtime card representation (loaded from DB for scoring)
// ------------------------------------------------------------------

export type TCardData = {
  id: string
  name: string
  suit: string
  basePower: number
  bonusRule: TBonusRule
  // Set by action card pre-processing (Island / Angel)
  penaltiesCleared?: boolean
  blankedProtected?: boolean
}

// ------------------------------------------------------------------
// Score output
// ------------------------------------------------------------------

export type TCardScoreDetail = {
  cardId: string
  name: string
  suit: string
  basePower: number
  bonus: number
  penalty: number
  net: number
  blanked: boolean
}

export type TScoreResult = {
  totalScore: number
  perCard: TCardScoreDetail[]
}
