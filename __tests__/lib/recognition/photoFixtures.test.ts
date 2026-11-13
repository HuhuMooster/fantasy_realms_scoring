import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  BASE_CARDS,
  CURSED_HOARD_ITEMS_CARDS,
  CURSED_HOARD_NEW_CARDS,
} from '@/db/cardDefs'
import { matchCards } from '@/lib/recognition/matchCards'

// OCR output of real photos, regenerate with `uv run python dump_fixtures.py` in recognizer/
const fixture = (name: string) =>
  JSON.parse(readFileSync(`recognizer/fixtures/${name}.json`, 'utf8'))

// Every card of every edition is a candidate, as when all editions are active
const cards = [
  ...BASE_CARDS,
  ...CURSED_HOARD_NEW_CARDS,
  ...CURSED_HOARD_ITEMS_CARDS,
].map(({ name }) => ({ id: name.toLowerCase(), name }))

const expected = {
  hand1: [
    'blizzard',
    'enchantress',
    'collector',
    'lich',
    'swamp',
    'dark queen',
    'fountain of life',
    'dwarvish infantry',
  ],
  hand2: [
    'rainstorm',
    'war dirigible',
    'death knight',
    'warlord',
    'magic wand',
    'chapel',
    'dungeon',
    'bell tower',
  ],
  hand3: [
    'genie',
    'forge',
    'jester',
    'gem of order',
    'warlock lord',
    'air elemental',
    'ghoul',
    'elven longbow',
  ],
  hand5: [
    'crystal lens',
    'staff of transmutation',
    'backpack',
    'blindfold',
    'wishing ring',
    'gold mirror',
    'junkyard map',
    'sealed vault',
    'market wagon',
    'book of prophecy',
    'hourglass',
    'crystal ball',
  ],
  hand6: [
    'wildfire',
    'shield of keth',
    'angel',
    'leprechaun',
    'warhorse',
    'judge',
    'lightning',
    'basilisk',
  ],
  hand7: [
    'winged boots',
    'shovel',
    'treasure chest',
    'cauldron',
    'portal',
    'sarcophagus',
    'repair kit',
    'larcenous gloves',
    'fishhook',
    'lantern',
    'rake',
  ],
  hand8: [
    'whirlwind',
    'light cavalry',
    'garden',
    'elven archers',
    'smoke',
    'fire elemental',
    'queen',
    'mountain',
  ],
  hand9: [
    'phoenix',
    'protection rune',
    'doppelganger',
    'demon',
    'island',
    'knights',
    'princess',
    'forest',
  ],
  hand10: [
    'warship',
    'king',
    'mirage',
    'water elemental',
    'cavern',
    'empress',
    'sword of keth',
    'shapeshifter',
  ],
  discard: [
    'specter',
    'crypt',
    'candle',
    'necromancer',
    'dragon',
    'beastmaster',
    'great flood',
    'rangers',
    'world tree',
    'castle',
    'book of changes',
    'unicorn',
    'hydra',
    'earth elemental',
  ],
}

describe('matchCards on real photos', () => {
  it.each(Object.entries(expected))(
    '%s finds exactly the cards in the photo',
    (name, cardIds) => {
      const found = matchCards(fixture(name), cards).matches.map((m) => m.cardId)
      expect(found.sort()).toEqual([...cardIds].sort())
    }
  )
})
