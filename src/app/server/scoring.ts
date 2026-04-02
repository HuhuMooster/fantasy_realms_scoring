import { createServerFn } from '@tanstack/react-start'
import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db/db'
import { cards } from '@/db/schema/cards'
import { scoreHand } from '@/lib/scoring/engine'
import { applyActionConfigs, buildHand } from '@/lib/scoring/handUtils'
import { actionConfigSchema } from '@/lib/validators'

const calculateScoreInput = z.object({
  cardIds: z.array(z.string()).min(1).max(20),
  actionConfigs: z.record(z.string(), actionConfigSchema).optional(),
})

export const calculateScore = createServerFn({ method: 'POST' })
  .inputValidator(calculateScoreInput)
  .handler(async ({ data }) => {
    const { cardIds, actionConfigs = {} } = data

    // Load all hand cards
    const rows = await db.select().from(cards).where(inArray(cards.id, cardIds))
    const rowMap = Object.fromEntries(rows.map((r) => [r.id, r]))

    // Collect additional card IDs needed for impersonation targets from deck
    const deckTargetIds = Object.values(actionConfigs)
      .filter((c) => c.type === 'impersonate_deck')
      .map((c) => c.targetCardId)
      .filter((id) => !rowMap[id])

    if (deckTargetIds.length > 0) {
      const extra = await db
        .select()
        .from(cards)
        .where(inArray(cards.id, deckTargetIds))
      for (const r of extra) rowMap[r.id] = r
    }

    const hand = applyActionConfigs(buildHand(rows), rowMap, actionConfigs)

    return scoreHand(hand)
  })

// Fetch a single card by id (used for validating targets)
export const getCardById = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const rows = await db.select().from(cards).where(eq(cards.id, data.id))
    if (!rows) throw new Error('Card not found')
    const row = rows[0]

    return { ...row, bonusRule: row.bonusRule as object }
  })
