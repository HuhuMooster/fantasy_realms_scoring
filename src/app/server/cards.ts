import { createServerFn } from '@tanstack/react-start'
import { and, eq, ilike } from 'drizzle-orm'
import { z } from 'zod'

import type { TSuit } from '@/components/cards/suit-badge'
import { db } from '@/db/db'
import { cards } from '@/db/schema/cards'
import { editions } from '@/db/schema/editions'
import { cardFiltersSchema } from '@/lib/validators'

export const getCards = createServerFn({ method: 'GET' })
  .inputValidator(cardFiltersSchema)
  .handler(async ({ data }) => {
    const conditions = []
    if (data.editionId) conditions.push(eq(cards.editionId, data.editionId))
    if (data.suit) conditions.push(eq(cards.suit, data.suit))
    if (data.q) conditions.push(ilike(cards.name, `%${data.q}%`))

    const rows = await db
      .select()
      .from(cards)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(cards.suit, cards.name)

    return rows.map((row) => ({
      ...row,
      bonusRule: row.bonusRule as object,
      suit: row.suit as TSuit,
    }))
  })

const getCardInput = z.object({ id: z.string() })

export const getCard = createServerFn({ method: 'GET' })
  .inputValidator(getCardInput)
  .handler(async ({ data }) => {
    const [row] = await db.select().from(cards).where(eq(cards.id, data.id))
    if (!row) throw new Error('Card not found')

    return { ...row, bonusRule: row.bonusRule as object }
  })

export const getEditions = createServerFn({ method: 'GET' }).handler(async () => {
  return db.select().from(editions).orderBy(editions.displayOrder)
})
