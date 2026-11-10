import { createServerFn } from '@tanstack/react-start'
import { inArray } from 'drizzle-orm'

import { userRateLimit } from '@/app/server/_rateLimit'
import { db } from '@/db/db'
import { cards } from '@/db/schema/cards'
import { recognizeImage } from '@/lib/recognition/recognize'

// Client sends FormData: `image` (File) + one `editionId` per active edition.
export const recognizeCards = createServerFn({ method: 'POST' })
  .middleware([userRateLimit('recognizeCards', 30, 60 * 1000)])
  .inputValidator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error('Expected form data')
    const image = data.get('image')
    if (!(image instanceof File)) throw new Error('Missing image')
    const editionIds = data.getAll('editionId').map(String)
    if (editionIds.length === 0) throw new Error('Select at least one edition')
    return { image, editionIds }
  })
  .handler(async ({ data }) => {
    const candidates = await db
      .select({ id: cards.id, name: cards.name })
      .from(cards)
      .where(inArray(cards.editionId, data.editionIds))
    return recognizeImage(data.image, candidates)
  })
