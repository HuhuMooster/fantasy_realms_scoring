import { sql } from 'drizzle-orm'

import { db } from '@/db/db'

// Atomically increment the coInter for a key, resetting it if the window has expired.
// Throws if the count exceeds the limit after incrementing.
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<void> {
  const windowSecs = Math.ceil(windowMs / 1000)

  const result = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limit_entries (key, count, reset_at)
    VALUES (
      ${key},
      1,
      NOW() + (${windowSecs} * interval '1 second')
    )
    ON CONFLICT (key) DO UPDATE
    SET
      count   = CASE
                  WHEN rate_limit_entries.reset_at <= NOW() THEN 1
                  ELSE rate_limit_entries.count + 1
                END,
      reset_at = CASE
                  WHEN rate_limit_entries.reset_at <= NOW()
                    THEN NOW() + (${windowSecs} * interval '1 second')
                  ELSE rate_limit_entries.reset_at
                END
    RETURNING count, reset_at
  `)

  const row = result[0]
  if (row && row.count > limit) {
    throw new Error('Too many requests. Please try again later.')
  }
}
