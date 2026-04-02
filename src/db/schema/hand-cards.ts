import { pgTable, primaryKey, text } from 'drizzle-orm/pg-core'

import { cards } from '@/db/schema/cards'
import { sessionPlayers } from '@/db/schema/session-players'

export const handCards = pgTable(
  'hand_cards',
  {
    sessionPlayerId: text('session_player_id')
      .notNull()
      .references(() => sessionPlayers.id, { onDelete: 'cascade' }),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id),
  },
  (t) => [primaryKey({ columns: [t.sessionPlayerId, t.cardId] })]
)
