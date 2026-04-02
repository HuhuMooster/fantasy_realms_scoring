import { createId } from '@paralleldrive/cuid2'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { sessionStatusEnum } from '@/db/schema/enums'

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull(),
  date: timestamp('date').notNull().defaultNow(),
  status: sessionStatusEnum('status').notNull().default('IN_PROGRESS'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
