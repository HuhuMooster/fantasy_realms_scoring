import { pgTable, primaryKey, text } from 'drizzle-orm/pg-core'

import { editions } from '@/db/schema/editions'
import { sessions } from '@/db/schema/sessions'

export const sessionEditions = pgTable(
  'session_editions',
  {
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    editionId: text('edition_id')
      .notNull()
      .references(() => editions.id),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.editionId] })]
)
