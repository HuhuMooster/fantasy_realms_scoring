import { pgTable, primaryKey, text } from 'drizzle-orm/pg-core'

import { cards } from '@/db/schema/cards'
import { sessions } from '@/db/schema/sessions'

export const discardCards = pgTable(
  'discard_cards',
  {
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.cardId] })]
)
