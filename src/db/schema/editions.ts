import { createId } from '@paralleldrive/cuid2'
import { integer, pgTable, text } from 'drizzle-orm/pg-core'

export const editions = pgTable('editions', {
  id: text('id').primaryKey().$defaultFn(createId),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
})
