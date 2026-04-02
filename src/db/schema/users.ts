import { createId } from '@paralleldrive/cuid2'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { roleEnum } from '@/db/schema/enums'

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(createId),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('PLAYER'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
