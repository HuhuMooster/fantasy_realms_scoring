import { createServerFn } from '@tanstack/react-start'
import { inArray } from 'drizzle-orm'

import { userRateLimit } from '@/app/server/_rateLimit'
import { db } from '@/db/db'
import { cards } from '@/db/schema/cards'
import { dropReplacedCards } from '@/lib/calculator/actions'
import { recognizeImage } from '@/lib/recognition/recognize'
import { recognizeCardsSchema } from '@/lib/validators'

export const recognizeCards = createServerFn({ method: 'POST' })
  .middleware([userRateLimit('recognizeCards', 30, 60 * 1000)])
  .inputValidator(recognizeCardsSchema)
  .handler(async ({ data }) => {
    const candidates = await db
      .select({ id: cards.id, name: cards.name })
      .from(cards)
      .where(inArray(cards.editionId, data.editionIds))
    // with Cursed Hoard active only its "Bell Tower (Cursed Hoard)" etc. can match, not the base card
    return recognizeImage(data.image, dropReplacedCards(candidates))
  })
