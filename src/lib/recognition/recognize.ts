import { env } from '@/env'
import { type TNamedCard, type TOcrBox, matchCards } from '@/lib/recognition/matchCards'

// Image type and size are checked by recognizeCardsSchema before this runs.
export async function recognizeImage(image: File, cards: TNamedCard[]) {
  const body = new FormData()
  body.append('image', image)
  const res = await fetch(`${env.RECOGNIZER_URL}/ocr`, { method: 'POST', body }).catch(
    () => undefined
  )
  if (!res?.ok) throw new Error('Card recognition is unavailable, add cards manually')
  const { boxes } = (await res.json()) as { boxes: TOcrBox[] }
  return matchCards(boxes, cards)
}
