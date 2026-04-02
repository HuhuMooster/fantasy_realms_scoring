import { createId } from '@paralleldrive/cuid2'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const inviteCodes = pgTable('invite_codes', {
  id: text('id').primaryKey().$defaultFn(createId),
  code: text('code').notNull().unique(),
  usedAt: timestamp('used_at'),
  usedBy: text('used_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: text('created_by').notNull(),
})
