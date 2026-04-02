import { createId } from '@paralleldrive/cuid2'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { cards } from '@/db/schema/cards'
import { editions } from '@/db/schema/editions'
import { inviteCodes } from '@/db/schema/invite-codes'
import { users } from '@/db/schema/users'
import { env } from '@/env'
import type { TBonusRule } from '@/lib/scoring/types'

const ADMIN_USERNAME = env.ADMIN_USERNAME
const ADMIN_PASSWORD = env.ADMIN_PASSWORD
const INITIAL_INVITE = env.INITIAL_INVITE_CODE

const client = postgres(env.DATABASE_URL, { max: 1 })
const db = drizzle(client)

type TCardDef = {
  name: string
  suit: string
  basePower: number
  description: string
  bonusRule: TBonusRule
}

// ---------------------------------------------------------------------------
// BASE GAME -- 56 cards (FR01-FR55, FR55P)
// Suits: land, flood, weather, flame, army, wizard, leader, beast, weapon,
//        artifact, wild
// ---------------------------------------------------------------------------
const BASE_CARDS: TCardDef[] = [
  // -----------------------------------------------------------------------
  // LAND (5)
  // -----------------------------------------------------------------------
  {
    name: 'Mountain',
    suit: 'land',
    basePower: 9,
    description: '+50 with both Smoke and Wildfire. CLEARS the Penalty on all Floods.',
    bonusRule: [
      {
        condition: {
          type: 'AND',
          conditions: [
            { type: 'HAS_CARD', name: 'Smoke' },
            { type: 'HAS_CARD', name: 'Wildfire' },
          ],
        },
        effects: [{ type: 'BONUS_FLAT', amount: 50 }],
      },
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'CLEARS_SUIT_PENALTY', suit: 'flood' }],
      },
    ],
  },
  {
    name: 'Cavern',
    suit: 'land',
    basePower: 6,
    description:
      '+25 with Dwarvish Infantry or Dragon. CLEARS the Penalty on all Weather.',
    bonusRule: [
      {
        condition: {
          type: 'OR',
          conditions: [
            { type: 'HAS_CARD', name: 'Dwarvish Infantry' },
            { type: 'HAS_CARD', name: 'Dragon' },
          ],
        },
        effects: [{ type: 'BONUS_FLAT', amount: 25 }],
      },
      {
        condition: { type: 'ALWAYS' },
        effects: [
          { type: 'CLEARS_SUIT_PENALTY', suit: 'weather' },
          { type: 'CLEARS_CARD_PENALTY', name: 'Phoenix' },
          { type: 'CLEARS_CARD_PENALTY', name: 'Phoenix (Promo)' },
        ],
      },
    ],
  },
  {
    name: 'Bell Tower',
    suit: 'land',
    basePower: 8,
    description: '+15 with any one Wizard.',
    bonusRule: [
      {
        condition: { type: 'HAS_SUIT', suit: 'wizard' },
        effects: [{ type: 'BONUS_FLAT', amount: 15 }],
      },
    ],
  },
  {
    name: 'Forest',
    suit: 'land',
    basePower: 7,
    description: '+12 for each Beast and Elven Archers.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'BONUS_PER', suit: 'beast', amount: 12 }],
      },
      {
        condition: { type: 'HAS_CARD', name: 'Elven Archers' },
        effects: [{ type: 'BONUS_FLAT', amount: 12 }],
      },
    ],
  },
  {
    name: 'Earth Elemental',
    suit: 'land',
    basePower: 4,
    description: '+15 for each other Land.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'BONUS_PER', suit: 'land', amount: 15 }],
      },
    ],
  },

  // -----------------------------------------------------------------------
  // FLOOD (5)
  // -----------------------------------------------------------------------
  {
    name: 'Fountain of Life',
    suit: 'flood',
    basePower: 1,
    description:
      'Add the base strength of any one Weapon, Flood, Flame, Land or Weather in your hand.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [
          {
            type: 'BONUS_HIGHEST_SUIT_STRENGTH',
            suits: ['weapon', 'flood', 'flame', 'land', 'weather'],
            alsoNames: ['Phoenix', 'Phoenix (Promo)'],
          },
        ],
      },
    ],
  },
  {
    name: 'Swamp',
    suit: 'flood',
    basePower: 18,
    description: '-3 for each Army and Flame.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'PENALTY_PER', suit: 'flame', amount: 3 }],
      },
      {
        condition: {
          type: 'NOT',
          condition: {
            type: 'OR',
            conditions: [
              { type: 'HAS_CARD', name: 'Rangers' },
              { type: 'HAS_CARD', name: 'Warship' },
            ],
          },
        },
        effects: [{ type: 'PENALTY_PER', suit: 'army', amount: 3 }],
      },
    ],
  },
  {
    name: 'Great Flood',
    suit: 'flood',
    basePower: 32,
    description:
      'BLANKS all Armies, all Lands except Mountain, and all Flames except Lightning.',
    bonusRule: [
      {
        condition: {
          type: 'NOT',
          condition: {
            type: 'OR',
            conditions: [
              { type: 'HAS_CARD', name: 'Rangers' },
              { type: 'HAS_CARD', name: 'Warship' },
            ],
          },
        },
        effects: [{ type: 'BLANK_SUIT', suit: 'army' }],
      },
      {
        condition: { type: 'ALWAYS' },
        effects: [
          { type: 'BLANK_SUIT_EXCEPT', suit: 'land', exceptNames: ['Mountain'] },
          {
            type: 'BLANK_SUIT_EXCEPT',
            suit: 'flame',
            exceptNames: ['Lightning'],
          },
          { type: 'BLANK_CARD', name: 'Phoenix (Promo)' },
        ],
      },
    ],
  },
  {
    name: 'Island',
    suit: 'flood',
    basePower: 14,
    description: 'CLEARS the Penalty on any one Flood or Flame.',
    bonusRule: [],
  },
  {
    name: 'Water Elemental',
    suit: 'flood',
    basePower: 4,
    description: '+15 for each other Flood.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'BONUS_PER', suit: 'flood', amount: 15 }],
      },
    ],
  },

  // -----------------------------------------------------------------------
  // WEATHER (5)
  // -----------------------------------------------------------------------
  {
    name: 'Rainstorm',
    suit: 'weather',
    basePower: 8,
    description: '+10 for each Flood. BLANKS all Flames except Lightning.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [
          { type: 'BONUS_PER', suit: 'flood', amount: 10 },
          {
            type: 'BLANK_SUIT_EXCEPT',
            suit: 'flame',
            exceptNames: ['Lightning'],
          },
          { type: 'BLANK_CARD', name: 'Phoenix (Promo)' },
        ],
      },
    ],
  },
  {
    name: 'Blizzard',
    suit: 'weather',
    basePower: 30,
    description: 'BLANKS all Floods. -5 for each Army, Leader, Beast, and Flame.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [
          { type: 'PENALTY_PER', suit: 'leader', amount: 5 },
          { type: 'PENALTY_PER', suit: 'beast', amount: 5 },
          { type: 'PENALTY_PER', suit: 'flame', amount: 5 },
          { type: 'BLANK_SUIT', suit: 'flood' },
        ],
      },
      {
        condition: {
          type: 'NOT',
          condition: { type: 'HAS_CARD', name: 'Rangers' },
        },
        effects: [{ type: 'PENALTY_PER', suit: 'army', amount: 5 }],
      },
    ],
  },
  {
    name: 'Smoke',
    suit: 'weather',
    basePower: 27,
    description: 'This card is BLANKED unless with at least one Flame.',
    bonusRule: [
      {
        condition: {
          type: 'NOT',
          condition: { type: 'HAS_SUIT', suit: 'flame' },
        },
        effects: [{ type: 'BLANK_SELF' }],
      },
    ],
  },
  {
    name: 'Whirlwind',
    suit: 'weather',
    basePower: 13,
    description: '+40 with Rainstorm and either Blizzard or Great Flood.',
    bonusRule: [
      {
        condition: {
          type: 'AND',
          conditions: [
            { type: 'HAS_CARD', name: 'Rainstorm' },
            {
              type: 'OR',
              conditions: [
                { type: 'HAS_CARD', name: 'Blizzard' },
                { type: 'HAS_CARD', name: 'Great Flood' },
              ],
            },
          ],
        },
        effects: [{ type: 'BONUS_FLAT', amount: 40 }],
      },
    ],
  },
  {
    name: 'Air Elemental',
    suit: 'weather',
    basePower: 4,
    description: '+15 for each other Weather.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'BONUS_PER', suit: 'weather', amount: 15 }],
      },
    ],
  },

  // -----------------------------------------------------------------------
  // FLAME (5)
  // -----------------------------------------------------------------------
  {
    name: 'Wildfire',
    suit: 'flame',
    basePower: 40,
    description:
      'BLANKS all cards except Flames, Wizards, Weather, Weapons, Artifacts, Mountain, Great Flood, Island, Unicorn and Dragon.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [
          {
            type: 'BLANK_SUIT_EXCEPT',
            suit: 'land',
            exceptNames: ['Mountain'],
          },
          {
            type: 'BLANK_SUIT_EXCEPT',
            suit: 'flood',
            exceptNames: ['Great Flood', 'Island'],
          },
          { type: 'BLANK_SUIT', suit: 'army' },
          { type: 'BLANK_SUIT', suit: 'leader' },
          {
            type: 'BLANK_SUIT_EXCEPT',
            suit: 'beast',
            exceptNames: ['Unicorn', 'Dragon', 'Phoenix'],
          },
        ],
      },
    ],
  },
  {
    name: 'Candle',
    suit: 'flame',
    basePower: 2,
    description: '+100 with Book of Changes, Bell Tower, and any one Wizard.',
    bonusRule: [
      {
        condition: {
          type: 'AND',
          conditions: [
            { type: 'HAS_CARD', name: 'Book of Changes' },
            { type: 'HAS_CARD', name: 'Bell Tower' },
            { type: 'HAS_SUIT', suit: 'wizard' },
          ],
        },
        effects: [{ type: 'BONUS_FLAT', amount: 100 }],
      },
    ],
  },
  {
    name: 'Forge',
    suit: 'flame',
    basePower: 9,
    description: '+9 for each Weapon and Artifact.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [
          { type: 'BONUS_PER', suit: 'weapon', amount: 9 },
          { type: 'BONUS_PER', suit: 'artifact', amount: 9 },
        ],
      },
    ],
  },
  {
    name: 'Lightning',
    suit: 'flame',
    basePower: 11,
    description: '+30 with Rainstorm.',
    bonusRule: [
      {
        condition: { type: 'HAS_CARD', name: 'Rainstorm' },
        effects: [{ type: 'BONUS_FLAT', amount: 30 }],
      },
    ],
  },
  {
    name: 'Fire Elemental',
    suit: 'flame',
    basePower: 4,
    description: '+15 for each other Flame.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'BONUS_PER', suit: 'flame', amount: 15 }],
      },
    ],
  },

  // -----------------------------------------------------------------------
  // ARMY (5)
  // -----------------------------------------------------------------------
  {
    name: 'Knights',
    suit: 'army',
    basePower: 20,
    description: '-8 unless with at least one Leader.',
    bonusRule: [
      {
        condition: {
          type: 'NOT',
          condition: { type: 'HAS_SUIT', suit: 'leader' },
        },
        effects: [{ type: 'PENALTY_FLAT', amount: 8 }],
      },
    ],
  },
  {
    name: 'Elven Archers',
    suit: 'army',
    basePower: 10,
    description: '+5 if no Weather.',
    bonusRule: [
      {
        condition: {
          type: 'NOT',
          condition: { type: 'HAS_SUIT', suit: 'weather' },
        },
        effects: [{ type: 'BONUS_FLAT', amount: 5 }],
      },
    ],
  },
  {
    name: 'Light Cavalry',
    suit: 'army',
    basePower: 17,
    description: '-2 for each Land.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'PENALTY_PER', suit: 'land', amount: 2 }],
      },
    ],
  },
  {
    name: 'Dwarvish Infantry',
    suit: 'army',
    basePower: 15,
    description: '-2 for each other Army.',
    bonusRule: [
      {
        condition: {
          type: 'NOT',
          condition: { type: 'HAS_CARD', name: 'Rangers' },
        },
        effects: [{ type: 'PENALTY_PER', suit: 'army', amount: 2, excludeSelf: true }],
      },
    ],
  },
  {
    name: 'Rangers',
    suit: 'army',
    basePower: 5,
    description: '+10 for each Land. CLEARS the word Army from all Penalties.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'BONUS_PER', suit: 'land', amount: 10 }],
      },
    ],
  },

  // -----------------------------------------------------------------------
  // WIZARD (6)
  // -----------------------------------------------------------------------
  {
    name: 'Collector',
    suit: 'wizard',
    basePower: 7,
    description:
      '+10 if three different cards in same suit, +40 if four different cards in same suit, +100 if five different cards in same suit.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'BONUS_COLLECTOR' }],
      },
    ],
  },
  {
    name: 'Beastmaster',
    suit: 'wizard',
    basePower: 9,
    description: '+9 for each Beast. CLEARS the Penalty on all Beasts.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [
          { type: 'BONUS_PER', suit: 'beast', amount: 9 },
          { type: 'CLEARS_SUIT_PENALTY', suit: 'beast' },
        ],
      },
    ],
  },
  {
    name: 'Necromancer',
    suit: 'wizard',
    basePower: 3,
    description:
      'At the end of the game, you may take one Army, Leader, Wizard, or Beast from the discard pile and add it to your hand.',
    bonusRule: [],
  },
  {
    name: 'Warlock Lord',
    suit: 'wizard',
    basePower: 25,
    description: '-10 for each Leader and other Wizard.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [
          { type: 'PENALTY_PER', suit: 'leader', amount: 10 },
          { type: 'PENALTY_PER', suit: 'wizard', amount: 10, excludeSelf: true },
        ],
      },
    ],
  },
  {
    name: 'Enchantress',
    suit: 'wizard',
    basePower: 5,
    description: '+5 for each Land, Weather, Flood, and Flame.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [
          { type: 'BONUS_PER', suit: 'land', amount: 5 },
          { type: 'BONUS_PER', suit: 'weather', amount: 5 },
          { type: 'BONUS_PER', suit: 'flood', amount: 5 },
          { type: 'BONUS_PER', suit: 'flame', amount: 5 },
        ],
      },
    ],
  },
  {
    name: 'Jester',
    suit: 'wizard',
    basePower: 3,
    description:
      '+3 for each other card with an odd base value. OR +50 if entire hand has odd base values.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'BONUS_JESTER' }],
      },
    ],
  },

  // -----------------------------------------------------------------------
  // LEADER (5)
  // -----------------------------------------------------------------------
  {
    name: 'King',
    suit: 'leader',
    basePower: 8,
    description: '+5 for each Army. OR +20 for each Army if with Queen.',
    bonusRule: [
      {
        condition: { type: 'HAS_CARD', name: 'Queen' },
        effects: [{ type: 'BONUS_PER', suit: 'army', amount: 20 }],
      },
      {
        condition: {
          type: 'NOT',
          condition: { type: 'HAS_CARD', name: 'Queen' },
        },
        effects: [{ type: 'BONUS_PER', suit: 'army', amount: 5 }],
      },
    ],
  },
  {
    name: 'Queen',
    suit: 'leader',
    basePower: 6,
    description: '+5 for each Army. OR +20 for each Army if with King.',
    bonusRule: [
      {
        condition: { type: 'HAS_CARD', name: 'King' },
        effects: [{ type: 'BONUS_PER', suit: 'army', amount: 20 }],
      },
      {
        condition: {
          type: 'NOT',
          condition: { type: 'HAS_CARD', name: 'King' },
        },
        effects: [{ type: 'BONUS_PER', suit: 'army', amount: 5 }],
      },
    ],
  },
  {
    name: 'Princess',
    suit: 'leader',
    basePower: 2,
    description: '+8 for each Army, Wizard, and other Leader.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [
          { type: 'BONUS_PER', suit: 'army', amount: 8 },
          { type: 'BONUS_PER', suit: 'wizard', amount: 8 },
          { type: 'BONUS_PER', suit: 'leader', amount: 8 },
        ],
      },
    ],
  },
  {
    name: 'Warlord',
    suit: 'leader',
    basePower: 4,
    description: 'The sum of the base strength of all Armies.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'BONUS_SUM_SUIT_STRENGTH', suit: 'army' }],
      },
    ],
  },
  {
    name: 'Empress',
    suit: 'leader',
    basePower: 15,
    description: '+10 for each Army. -5 for each other Leader.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [
          { type: 'BONUS_PER', suit: 'army', amount: 10 },
          { type: 'PENALTY_PER', suit: 'leader', amount: 5, excludeSelf: true },
        ],
      },
    ],
  },

  // -----------------------------------------------------------------------
  // BEAST (6 incl. Phoenix)
  // -----------------------------------------------------------------------
  {
    name: 'Unicorn',
    suit: 'beast',
    basePower: 9,
    description: '+30 with Princess. OR +15 with Empress, Queen, or Enchantress.',
    bonusRule: [
      {
        condition: { type: 'HAS_CARD', name: 'Princess' },
        effects: [{ type: 'BONUS_FLAT', amount: 30 }],
      },
      {
        condition: {
          type: 'AND',
          conditions: [
            {
              type: 'NOT',
              condition: { type: 'HAS_CARD', name: 'Princess' },
            },
            {
              type: 'OR',
              conditions: [
                { type: 'HAS_CARD', name: 'Empress' },
                { type: 'HAS_CARD', name: 'Queen' },
                { type: 'HAS_CARD', name: 'Enchantress' },
              ],
            },
          ],
        },
        effects: [{ type: 'BONUS_FLAT', amount: 15 }],
      },
    ],
  },
  {
    name: 'Basilisk',
    suit: 'beast',
    basePower: 35,
    description: 'BLANKS all Armies, Leaders, and other Beasts.',
    bonusRule: [
      {
        condition: {
          type: 'NOT',
          condition: { type: 'HAS_CARD', name: 'Rangers' },
        },
        effects: [{ type: 'BLANK_SUIT', suit: 'army' }],
      },
      {
        condition: { type: 'ALWAYS' },
        effects: [
          { type: 'BLANK_SUIT', suit: 'leader' },
          { type: 'BLANK_CARD', name: 'Unicorn' },
          { type: 'BLANK_CARD', name: 'Warhorse' },
          { type: 'BLANK_CARD', name: 'Dragon' },
          { type: 'BLANK_CARD', name: 'Hydra' },
        ],
      },
    ],
  },
  {
    name: 'Warhorse',
    suit: 'beast',
    basePower: 6,
    description: '+14 with any Leader or Wizard.',
    bonusRule: [
      {
        condition: {
          type: 'OR',
          conditions: [
            { type: 'HAS_SUIT', suit: 'leader' },
            { type: 'HAS_SUIT', suit: 'wizard' },
          ],
        },
        effects: [{ type: 'BONUS_FLAT', amount: 14 }],
      },
    ],
  },
  {
    name: 'Dragon',
    suit: 'beast',
    basePower: 30,
    description: '-40 unless with at least one Wizard.',
    bonusRule: [
      {
        condition: {
          type: 'NOT',
          condition: { type: 'HAS_SUIT', suit: 'wizard' },
        },
        effects: [{ type: 'PENALTY_FLAT', amount: 40 }],
      },
    ],
  },
  {
    name: 'Hydra',
    suit: 'beast',
    basePower: 12,
    description: '+28 with Swamp.',
    bonusRule: [
      {
        condition: { type: 'HAS_CARD', name: 'Swamp' },
        effects: [{ type: 'BONUS_FLAT', amount: 28 }],
      },
    ],
  },
  {
    name: 'Phoenix',
    suit: 'beast',
    basePower: 14,
    description:
      'Also counts as a Flame and Weather card. Phoenix is immune to the Book of Changes and may not BLANK or be BLANKED by any other card. BLANKED with any Flood.',
    bonusRule: [
      {
        condition: { type: 'HAS_SUIT', suit: 'flood' },
        effects: [{ type: 'BLANK_SELF' }],
      },
    ],
  },

  // -----------------------------------------------------------------------
  // WEAPON (5)
  // -----------------------------------------------------------------------
  {
    name: 'Warship',
    suit: 'weapon',
    basePower: 23,
    description:
      'CLEARS the word Army from all Penalties of all Floods. BLANKED unless with at least one Flood.',
    bonusRule: [
      {
        condition: {
          type: 'NOT',
          condition: { type: 'HAS_SUIT', suit: 'flood' },
        },
        effects: [{ type: 'BLANK_SELF' }],
      },
    ],
  },
  {
    name: 'Magic Wand',
    suit: 'weapon',
    basePower: 1,
    description: '+25 with any one Wizard.',
    bonusRule: [
      {
        condition: { type: 'HAS_SUIT', suit: 'wizard' },
        effects: [{ type: 'BONUS_FLAT', amount: 25 }],
      },
    ],
  },
  {
    name: 'Sword of Keth',
    suit: 'weapon',
    basePower: 7,
    description: '+10 with any one Leader. OR +40 with both Leader and Shield of Keth.',
    bonusRule: [
      {
        condition: {
          type: 'AND',
          conditions: [
            { type: 'HAS_SUIT', suit: 'leader' },
            { type: 'HAS_CARD', name: 'Shield of Keth' },
          ],
        },
        effects: [{ type: 'BONUS_FLAT', amount: 40 }],
      },
      {
        condition: {
          type: 'AND',
          conditions: [
            { type: 'HAS_SUIT', suit: 'leader' },
            {
              type: 'NOT',
              condition: { type: 'HAS_CARD', name: 'Shield of Keth' },
            },
          ],
        },
        effects: [{ type: 'BONUS_FLAT', amount: 10 }],
      },
    ],
  },
  {
    name: 'Elven Longbow',
    suit: 'weapon',
    basePower: 3,
    description: '+30 with Elven Archers, Warlord or Beastmaster.',
    bonusRule: [
      {
        condition: {
          type: 'OR',
          conditions: [
            { type: 'HAS_CARD', name: 'Elven Archers' },
            { type: 'HAS_CARD', name: 'Warlord' },
            { type: 'HAS_CARD', name: 'Beastmaster' },
          ],
        },
        effects: [{ type: 'BONUS_FLAT', amount: 30 }],
      },
    ],
  },
  {
    name: 'War Dirigible',
    suit: 'weapon',
    basePower: 35,
    description: 'BLANKED unless with at least one Army. BLANKED with any Weather.',
    bonusRule: [
      {
        condition: { type: 'HAS_SUIT', suit: 'weather' },
        effects: [{ type: 'BLANK_SELF' }],
      },
      {
        condition: {
          type: 'AND',
          conditions: [
            {
              type: 'NOT',
              condition: { type: 'HAS_SUIT', suit: 'army' },
            },
            {
              type: 'NOT',
              condition: { type: 'HAS_CARD', name: 'Rangers' },
            },
          ],
        },
        effects: [{ type: 'BLANK_SELF' }],
      },
    ],
  },

  // -----------------------------------------------------------------------
  // ARTIFACT (5)
  // -----------------------------------------------------------------------
  {
    name: 'Shield of Keth',
    suit: 'artifact',
    basePower: 4,
    description: '+15 with any one Leader. OR +40 with both Leader and Sword of Keth.',
    bonusRule: [
      {
        condition: {
          type: 'AND',
          conditions: [
            { type: 'HAS_SUIT', suit: 'leader' },
            { type: 'HAS_CARD', name: 'Sword of Keth' },
          ],
        },
        effects: [{ type: 'BONUS_FLAT', amount: 40 }],
      },
      {
        condition: {
          type: 'AND',
          conditions: [
            { type: 'HAS_SUIT', suit: 'leader' },
            {
              type: 'NOT',
              condition: { type: 'HAS_CARD', name: 'Sword of Keth' },
            },
          ],
        },
        effects: [{ type: 'BONUS_FLAT', amount: 15 }],
      },
    ],
  },
  {
    name: 'Gem of Order',
    suit: 'artifact',
    basePower: 5,
    description:
      '+10 for 3-card run, +30 for 4-card run, +60 for 5-card run, +100 for 6-card run, +150 for 7-card run. (This refers to the base strength numbers.)',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'BONUS_GEM_OF_ORDER' }],
      },
    ],
  },
  {
    name: 'World Tree',
    suit: 'artifact',
    basePower: 2,
    description: '+50 if every non-BLANKED card is a different suit.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'BONUS_WORLD_TREE', amount: 50 }],
      },
    ],
  },
  {
    name: 'Book of Changes',
    suit: 'artifact',
    basePower: 3,
    description:
      'You may change the suit of one other card. Its name, bonuses and penalties remain the same.',
    bonusRule: [],
  },
  {
    name: 'Protection Rune',
    suit: 'artifact',
    basePower: 1,
    description: 'CLEARS the Penalty on all cards.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'CLEARS_ALL_PENALTIES' }],
      },
    ],
  },

  // -----------------------------------------------------------------------
  // WILD (3)
  // -----------------------------------------------------------------------
  {
    name: 'Shapeshifter',
    suit: 'wild',
    basePower: 0,
    description:
      'Shapeshifter may duplicate the name and suit of any one Artifact, Leader, Wizard, Weapon or Beast in the game. Does not take the bonus, penalty, or base strength of the card duplicated.',
    bonusRule: [],
  },
  {
    name: 'Mirage',
    suit: 'wild',
    basePower: 0,
    description:
      'Mirage may duplicate the name and suit of any one Army, Land, Weather, Flood or Flame in the game. Does not take the bonus, penalty, or base strength of the card duplicated.',
    bonusRule: [],
  },
  {
    name: 'Doppelganger',
    suit: 'wild',
    basePower: 0,
    description:
      'Doppelganger may duplicate the name, base strength, suit, and penalty BUT NOT BONUS of any one other card in your hand.',
    bonusRule: [],
  },

  // -----------------------------------------------------------------------
  // PROMO (1)
  // -----------------------------------------------------------------------
  {
    name: 'Phoenix (Promo)',
    suit: 'beast',
    basePower: 14,
    description:
      'Also counts as a Flame and Weather card. If this card is BLANKED for any reason, its base strength is reduced to 0 but it retains its suits. BLANKED with any Flood.',
    bonusRule: [
      {
        condition: { type: 'HAS_SUIT', suit: 'flood' },
        effects: [{ type: 'BLANK_SELF' }],
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// CURSED HOARD -- CH01-CH47
// New suits: building, outsider, undead, cursed-item
// ---------------------------------------------------------------------------
const CURSED_HOARD_CARDS: TCardDef[] = [
  // -----------------------------------------------------------------------
  // BUILDING (4 new + 1 replacement Bell Tower)
  // -----------------------------------------------------------------------
  {
    name: 'Dungeon',
    suit: 'building',
    basePower: 7,
    description:
      '+10 each for the first Undead, Beast, and Artifact. +5 for each additional card in any of these suits and Necromancer, Warlock Lord, Demon.',
    bonusRule: [
      {
        condition: { type: 'HAS_SUIT', suit: 'undead' },
        effects: [
          { type: 'BONUS_FLAT', amount: 5 },
          { type: 'BONUS_PER', suit: 'undead', amount: 5 },
        ],
      },
      {
        condition: { type: 'HAS_SUIT', suit: 'beast' },
        effects: [
          { type: 'BONUS_FLAT', amount: 5 },
          { type: 'BONUS_PER', suit: 'beast', amount: 5 },
        ],
      },
      {
        condition: { type: 'HAS_SUIT', suit: 'artifact' },
        effects: [
          { type: 'BONUS_FLAT', amount: 5 },
          { type: 'BONUS_PER', suit: 'artifact', amount: 5 },
        ],
      },
      {
        condition: { type: 'HAS_CARD', name: 'Necromancer' },
        effects: [{ type: 'BONUS_FLAT', amount: 5 }],
      },
      {
        condition: { type: 'HAS_CARD', name: 'Warlock Lord' },
        effects: [{ type: 'BONUS_FLAT', amount: 5 }],
      },
      {
        condition: { type: 'HAS_CARD', name: 'Demon' },
        effects: [{ type: 'BONUS_FLAT', amount: 5 }],
      },
    ],
  },
  {
    name: 'Castle',
    suit: 'building',
    basePower: 10,
    description:
      '+10 for the first Leader, Army, Land, and other Building. +5 for each additional Building.',
    bonusRule: [
      {
        condition: { type: 'HAS_SUIT', suit: 'leader' },
        effects: [{ type: 'BONUS_FLAT', amount: 10 }],
      },
      {
        condition: { type: 'HAS_SUIT', suit: 'army' },
        effects: [{ type: 'BONUS_FLAT', amount: 10 }],
      },
      {
        condition: { type: 'HAS_SUIT', suit: 'land' },
        effects: [{ type: 'BONUS_FLAT', amount: 10 }],
      },
      {
        condition: { type: 'SUIT_COUNT_GTE', suit: 'building', n: 2 },
        effects: [
          { type: 'BONUS_FLAT', amount: 5 },
          { type: 'BONUS_PER', suit: 'building', amount: 5 },
        ],
      },
    ],
  },
  {
    name: 'Crypt',
    suit: 'building',
    basePower: 21,
    description: 'The sum of the base strength of all Undead. BLANKs all Leaders.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [
          { type: 'BONUS_SUM_SUIT_STRENGTH', suit: 'undead' },
          { type: 'BLANK_SUIT', suit: 'leader' },
        ],
      },
    ],
  },
  {
    name: 'Chapel',
    suit: 'building',
    basePower: 2,
    description:
      '+40 if you have exactly two cards from among these suits: Leader, Wizard, Outsider, and Undead.',
    bonusRule: [
      {
        condition: {
          type: 'MULTI_SUIT_COUNT_EQ',
          suits: ['leader', 'wizard', 'outsider', 'undead'],
          count: 2,
        },
        effects: [{ type: 'BONUS_FLAT', amount: 40 }],
      },
    ],
  },
  // CH16: Bell Tower replacement (building suit, replaces FR03 land Bell Tower)
  {
    name: 'Bell Tower (Cursed Hoard)',
    suit: 'building',
    basePower: 8,
    description: '+15 with any one Wizard or Undead.',
    bonusRule: [
      {
        condition: {
          type: 'OR',
          conditions: [
            { type: 'HAS_SUIT', suit: 'wizard' },
            { type: 'HAS_SUIT', suit: 'undead' },
          ],
        },
        effects: [{ type: 'BONUS_FLAT', amount: 15 }],
      },
    ],
  },

  // -----------------------------------------------------------------------
  // LAND addition (Cursed Hoard)
  // -----------------------------------------------------------------------
  {
    name: 'Garden',
    suit: 'land',
    basePower: 11,
    description:
      '+11 for each Leader and Beast. BLANKED by any Undead, Necromancer, or Demon.',
    bonusRule: [
      {
        condition: {
          type: 'NOT',
          condition: {
            type: 'OR',
            conditions: [
              { type: 'HAS_SUIT', suit: 'undead' },
              { type: 'HAS_CARD', name: 'Necromancer' },
              { type: 'HAS_CARD', name: 'Demon' },
            ],
          },
        },
        effects: [
          { type: 'BONUS_PER', suit: 'leader', amount: 11 },
          { type: 'BONUS_PER', suit: 'beast', amount: 11 },
        ],
      },
      {
        condition: {
          type: 'OR',
          conditions: [
            { type: 'HAS_SUIT', suit: 'undead' },
            { type: 'HAS_CARD', name: 'Necromancer' },
            { type: 'HAS_CARD', name: 'Demon' },
          ],
        },
        effects: [{ type: 'BLANK_SELF' }],
      },
    ],
  },

  // -----------------------------------------------------------------------
  // OUTSIDER (5)
  // -----------------------------------------------------------------------
  {
    name: 'Genie',
    suit: 'outsider',
    basePower: -50,
    description:
      '+10 per other player. At the end of the game, look through the draw deck and put one card in your hand. (Resolves after Leprechaun.)',
    bonusRule: [],
  },
  {
    name: 'Judge',
    suit: 'outsider',
    basePower: 11,
    description: '+10 for each card that contains a Penalty that is not CLEARED.',
    bonusRule: [],
  },
  {
    name: 'Angel',
    suit: 'outsider',
    basePower: 16,
    description:
      'Prevent one other card from being BLANKED. This card can never be BLANKED.',
    bonusRule: [],
  },
  {
    name: 'Leprechaun',
    suit: 'outsider',
    basePower: 20,
    description:
      'Draw the top card from the deck at the end of the game and add it to your hand. (Resolves before Genie.)',
    bonusRule: [],
  },
  {
    name: 'Demon',
    suit: 'outsider',
    basePower: 45,
    description:
      'For every non-Outsider card: If that card is the only card you have in that suit, then that card is BLANKED. This takes place before any other BLANKING.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'BLANK_DEMON' }],
      },
    ],
  },

  // -----------------------------------------------------------------------
  // UNDEAD (5)
  // -----------------------------------------------------------------------
  {
    name: 'Dark Queen',
    suit: 'undead',
    basePower: 10,
    description:
      '+5 for each Land, Flood, Flame, Weather, and Unicorn in the discard area.',
    bonusRule: [],
  },
  {
    name: 'Ghoul',
    suit: 'undead',
    basePower: 8,
    description:
      '+4 for each Wizard, Leader, Army, Beast, and Undead in the discard area.',
    bonusRule: [],
  },
  {
    name: 'Specter',
    suit: 'undead',
    basePower: 12,
    description: '+6 for each Wizard, Artifact, and Outsider in the discard area.',
    bonusRule: [],
  },
  {
    name: 'Lich',
    suit: 'undead',
    basePower: 13,
    description:
      '+10 for Necromancer and each other Undead. Undead may not be BLANKED.',
    bonusRule: [
      {
        condition: { type: 'HAS_CARD', name: 'Necromancer' },
        effects: [{ type: 'BONUS_FLAT', amount: 10 }],
      },
      {
        condition: { type: 'ALWAYS' },
        effects: [
          { type: 'BONUS_PER', suit: 'undead', amount: 10 },
          { type: 'PROTECT_SUIT_FROM_BLANK', suit: 'undead' },
        ],
      },
    ],
  },
  {
    name: 'Death Knight',
    suit: 'undead',
    basePower: 14,
    description: '+7 for each Weapon and Army in the discard area.',
    bonusRule: [],
  },

  // -----------------------------------------------------------------------
  // REPLACEMENT CARDS (Cursed Hoard versions)
  // -----------------------------------------------------------------------
  {
    name: 'Fountain of Life (Cursed Hoard)',
    suit: 'flood',
    basePower: 1,
    description:
      'Add the base strength of any one Building, Weapon, Flood, Flame, Land or Weather in your hand.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [
          {
            type: 'BONUS_HIGHEST_SUIT_STRENGTH',
            suits: ['building', 'weapon', 'flood', 'flame', 'land', 'weather'],
            alsoNames: ['Phoenix', 'Phoenix (Promo)'],
          },
        ],
      },
    ],
  },
  {
    name: 'Great Flood (Cursed Hoard)',
    suit: 'flood',
    basePower: 32,
    description:
      'BLANKS all Armies, all Buildings, all Lands except Mountain, and all Flames except Lightning.',
    bonusRule: [
      {
        condition: {
          type: 'NOT',
          condition: {
            type: 'OR',
            conditions: [
              { type: 'HAS_CARD', name: 'Rangers' },
              { type: 'HAS_CARD', name: 'Warship' },
            ],
          },
        },
        effects: [{ type: 'BLANK_SUIT', suit: 'army' }],
      },
      {
        condition: { type: 'ALWAYS' },
        effects: [
          { type: 'BLANK_SUIT', suit: 'building' },
          { type: 'BLANK_SUIT_EXCEPT', suit: 'land', exceptNames: ['Mountain'] },
          {
            type: 'BLANK_SUIT_EXCEPT',
            suit: 'flame',
            exceptNames: ['Lightning'],
          },
          { type: 'BLANK_CARD', name: 'Phoenix (Promo)' },
        ],
      },
    ],
  },
  {
    name: 'Rangers (Cursed Hoard)',
    suit: 'army',
    basePower: 5,
    description:
      '+10 for each Land and Building. CLEARS the word Army from all Penalties.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [
          { type: 'BONUS_PER', suit: 'land', amount: 10 },
          { type: 'BONUS_PER', suit: 'building', amount: 10 },
        ],
      },
    ],
  },
  {
    name: 'Necromancer (Cursed Hoard)',
    suit: 'wizard',
    basePower: 3,
    description:
      'At the end of the game, you may take one Army, Leader, Wizard, Beast, or Undead from the discard pile and add it to your hand. Undead may not be BLANKED.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'PROTECT_SUIT_FROM_BLANK', suit: 'undead' }],
      },
    ],
  },
  {
    name: 'World Tree (Cursed Hoard)',
    suit: 'artifact',
    basePower: 2,
    description: '+70 if every non-BLANKED card is a different suit.',
    bonusRule: [
      {
        condition: { type: 'ALWAYS' },
        effects: [{ type: 'BONUS_WORLD_TREE', amount: 70 }],
      },
    ],
  },
  {
    name: 'Shapeshifter (Cursed Hoard)',
    suit: 'wild',
    basePower: 0,
    description:
      'Shapeshifter may duplicate the name and suit of any one Artifact, Leader, Wizard, Weapon, Beast, or Undead in the game. Does not take the bonus, penalty, or base strength of the card duplicated.',
    bonusRule: [],
  },
  {
    name: 'Mirage (Cursed Hoard)',
    suit: 'wild',
    basePower: 0,
    description:
      'Mirage may duplicate the name and suit of any one Army, Building, Land, Weather, Flood or Flame in the game. Does not take the bonus, penalty, or base strength of the card duplicated.',
    bonusRule: [],
  },

  // -----------------------------------------------------------------------
  // CURSED ITEMS (CH24-CH47) -- mostly negative base power, action cards
  // -----------------------------------------------------------------------
  {
    name: 'Spyglass',
    suit: 'cursed-item',
    basePower: -1,
    description:
      "Look at another player's hand. (*This item's base value is -10 in 2-player game)",
    bonusRule: [],
  },
  {
    name: 'Sarcophagus',
    suit: 'cursed-item',
    basePower: 5,
    description:
      'Take the top card from the deck and place it directly in the discard area, then end your turn. (The makeup of your hand will not change this turn.)',
    bonusRule: [],
  },
  {
    name: 'Blindfold',
    suit: 'cursed-item',
    basePower: 5,
    description:
      'Reverse normal turn order: discard a card first, then draw a card from the deck.',
    bonusRule: [],
  },
  {
    name: 'Book of Prophecy',
    suit: 'cursed-item',
    basePower: -1,
    description: 'Look at the bottom seven cards of the deck, then replace them there.',
    bonusRule: [],
  },
  {
    name: 'Crystal Ball',
    suit: 'cursed-item',
    basePower: -1,
    description:
      'Name a suit. All other players must reveal all cards they possess of that suit.',
    bonusRule: [],
  },
  {
    name: 'Market Wagon',
    suit: 'cursed-item',
    basePower: -2,
    description:
      'Reveal a card from your hand. Any other player may reveal up to 3 cards to offer in exchange. You may choose to trade your card for one of them; if no offer is acceptable, keep your card or discard it and draw from the deck.',
    bonusRule: [],
  },
  {
    name: 'Backpack',
    suit: 'cursed-item',
    basePower: -2,
    description:
      'Draw three Cursed Items and set them aside face up. The next three times you would draw a new Cursed Item from the deck, you must take one of these cards instead.',
    bonusRule: [],
  },
  {
    name: 'Shovel',
    suit: 'cursed-item',
    basePower: -2,
    description: 'Put a card from the discard area on the bottom of the deck.',
    bonusRule: [],
  },
  {
    name: 'Sealed Vault',
    suit: 'cursed-item',
    basePower: -4,
    description:
      'Cover two cards in the discard area with this card. They still count towards the end of the game and give bonuses to Undead, but no one but you may take them, and they are immune to Shovel and Gold Mirror.',
    bonusRule: [],
  },
  {
    name: 'Crystal Lens',
    suit: 'cursed-item',
    basePower: -2,
    description:
      'You may peek at the top card of the deck before deciding whether to draw from the deck or discard area.',
    bonusRule: [],
  },
  {
    name: 'Larcenous Gloves',
    suit: 'cursed-item',
    basePower: -3,
    description:
      'Steal a face-up Cursed Item from another player. You must use it immediately. The player you stole from must immediately draw a replacement from the Cursed Item deck.',
    bonusRule: [],
  },
  {
    name: 'Junkyard Map',
    suit: 'cursed-item',
    basePower: -3,
    description:
      'Take one of the top three discarded Cursed Item cards and play it immediately.',
    bonusRule: [],
  },
  {
    name: 'Winged Boots',
    suit: 'cursed-item',
    basePower: -4,
    description: 'Put the top card of the deck directly into the discard area.',
    bonusRule: [],
  },
  {
    name: 'Staff of Transmutation',
    suit: 'cursed-item',
    basePower: -4,
    description:
      'Return 3-8 cards from your hand to the bottom of the deck and replace them from the top of the deck.',
    bonusRule: [],
  },
  {
    name: 'Rake',
    suit: 'cursed-item',
    basePower: -4,
    description: 'Draw two cards from the discard area, then discard two cards.',
    bonusRule: [],
  },
  {
    name: 'Treasure Chest',
    suit: 'cursed-item',
    basePower: -5,
    description:
      'Worth +25 points at the end of the game if you have at least three other Cursed Items facedown.',
    bonusRule: [],
  },
  {
    name: 'Fishhook',
    suit: 'cursed-item',
    basePower: -6,
    description: 'Draw two cards from the deck, then discard any two cards.',
    bonusRule: [],
  },
  {
    name: 'Repair Kit',
    suit: 'cursed-item',
    basePower: -6,
    description:
      'Copy the ability of any Cursed Item you have already played other than Backpack, Sarcophagus, Blindfold, and Treasure Chest. Discard and redraw if you have no facedown Cursed Items.',
    bonusRule: [],
  },
  {
    name: 'Hourglass',
    suit: 'cursed-item',
    basePower: -7,
    description:
      'Take an extra turn. Do not replace this card with a new Cursed Item until after your second turn.',
    bonusRule: [],
  },
  {
    name: 'Gold Mirror',
    suit: 'cursed-item',
    basePower: -8,
    description:
      'Put three cards from the discard area on the bottom of the deck. Replace them with the top three cards of the deck.',
    bonusRule: [],
  },
  {
    name: 'Cauldron',
    suit: 'cursed-item',
    basePower: -9,
    description:
      'Instead of drawing a card from the deck, draw three cards, then place two of them on the top or bottom of the deck (or one each) before you discard normally.',
    bonusRule: [],
  },
  {
    name: 'Lantern',
    suit: 'cursed-item',
    basePower: -10,
    description:
      'Name a suit. Draw from the deck until you draw a card from that suit, or until you have drawn ten cards. (Wild cards do not count.) If you draw a card from the named suit, keep it and discard a different card from your hand. Show the other cards you drew and reshuffle them into the deck.',
    bonusRule: [],
  },
  {
    name: 'Portal',
    suit: 'cursed-item',
    basePower: -20,
    description:
      'Skip your discard phase this turn. (You will have one extra card in your hand from now on.)',
    bonusRule: [],
  },
  {
    name: 'Wishing Ring',
    suit: 'cursed-item',
    basePower: -30,
    description:
      'Look through the deck and place any card you wish on top. (You may do this immediately before you draw.) Reshuffle the deck at the end of your turn.',
    bonusRule: [],
  },
]

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------
;(async () => {
  // ---------- Admin user (idempotent) ----------
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, ADMIN_USERNAME))
  let adminId: string
  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
    adminId = createId()
    await db.insert(users).values({
      id: adminId,
      username: ADMIN_USERNAME,
      passwordHash,
      role: 'ADMIN',
    })
    console.log(`Admin user '${ADMIN_USERNAME}' created.`)
    await db.insert(inviteCodes).values({ code: INITIAL_INVITE, createdBy: adminId })
    console.log(`Invite code '${INITIAL_INVITE}' created.`)
  } else {
    adminId = existing[0].id
    console.log('Admin user already exists, skipping user seed.')
  }

  // ---------- Editions ----------
  async function upsertEdition(
    slug: string,
    name: string,
    displayOrder: number
  ): Promise<string> {
    const rows = await db.select().from(editions).where(eq(editions.slug, slug))
    if (rows.length > 0) return rows[0].id
    const [ed] = await db
      .insert(editions)
      .values({ slug, name, displayOrder })
      .returning()
    console.log(`Edition '${name}' created.`)
    return ed.id
  }

  const baseEditionId = await upsertEdition('base', 'Base Game', 1)
  const chEditionId = await upsertEdition('cursed-hoard', 'Cursed Hoard', 2)

  // ---------- Cards (delete + re-insert per edition for fresh data) ----------
  async function seedCards(defs: TCardDef[], editionId: string, label: string) {
    const existing = await db.select().from(cards).where(eq(cards.editionId, editionId))

    if (existing.length === defs.length) {
      console.log(`${label}: ${existing.length} cards already seeded, skipping.`)
      return
    }

    if (existing.length > 0) {
      await db.delete(cards).where(eq(cards.editionId, editionId))
      console.log(`${label}: removed ${existing.length} stale cards.`)
    }

    await db.insert(cards).values(
      defs.map((c) => ({
        name: c.name,
        suit: c.suit,
        basePower: c.basePower,
        editionId,
        bonusRule: c.bonusRule as object,
        description: c.description,
      }))
    )
    console.log(`${label}: seeded ${defs.length} cards.`)
  }

  await seedCards(BASE_CARDS, baseEditionId, 'Base Game')
  await seedCards(CURSED_HOARD_CARDS, chEditionId, 'Cursed Hoard')

  await client.end()
})()
