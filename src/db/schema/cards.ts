import { createId } from '@paralleldrive/cuid2'
import { integer, jsonb, pgTable, text, unique } from 'drizzle-orm/pg-core'

import { editions } from '@/db/schema/editions'

export const cards = pgTable(
  'cards',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    name: text('name').notNull(),
    suit: text('suit').notNull(),
    basePower: integer('base_power').notNull(),
    editionId: text('edition_id')
      .notNull()
      .references(() => editions.id),
    bonusRule: jsonb('bonus_rule').notNull(),
    description: text('description').notNull(),
    imageUrl: text('image_url'),
  },
  (t) => [unique().on(t.name, t.editionId)]
)
