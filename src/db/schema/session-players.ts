import { createId } from '@paralleldrive/cuid2'
import { integer, pgTable, text } from 'drizzle-orm/pg-core'

import { sessions } from '@/db/schema/sessions'

export const sessionPlayers = pgTable('session_players', {
  id: text('id').primaryKey().$defaultFn(createId),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  nickname: text('nickname').notNull(),
  finalScore: integer('final_score'),
})
