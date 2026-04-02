import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

// UNLOGGED table -- set in migration SQL for WAL-free writes (rate limit data is ephemeral)
export const rateLimitEntries = pgTable('rate_limit_entries', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
})
