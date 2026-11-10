import { env } from '@/env'
import { type TNamedCard, type TOcrBox, matchCards } from '@/lib/recognition/matchCards'

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export async function recognizeImage(image: File, cards: TNamedCard[]) {
  if (!image.type.startsWith('image/')) throw new Error('File must be an image')
  if (image.size > MAX_IMAGE_BYTES) throw new Error('Image must be 10 MB or smaller')

  const body = new FormData()
  body.append('image', image)
  const res = await fetch(`${env.RECOGNIZER_URL}/ocr`, { method: 'POST', body }).catch(
    () => undefined
  )
  if (!res?.ok) throw new Error('Card recognition is unavailable, add cards manually')
  const { boxes } = (await res.json()) as { boxes: TOcrBox[] }
  return matchCards(boxes, cards)
}
