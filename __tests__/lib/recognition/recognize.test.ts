// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

import { recognizeImage } from '@/lib/recognition/recognize'

vi.mock('@/env', () => ({ env: { RECOGNIZER_URL: 'http://recognizer:8000' } }))

const cards = [
  { id: 'queen', name: 'Queen' },
  { id: 'king', name: 'King' },
]

function fakeRecognizer(boxes: { text: string; confidence: number }[]) {
  const fetchMock = vi.fn(async () => Response.json({ boxes }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const photo = () => new File([new Uint8Array(10)], 'hand.jpg', { type: 'image/jpeg' })

afterEach(() => vi.unstubAllGlobals())

describe('recognizeImage', () => {
  it('sends the photo to the recognizer and matches the returned text to cards', async () => {
    const fetchMock = fakeRecognizer([
      { text: 'QUEEN', confidence: 1 },
      { text: 'blah', confidence: 1 },
    ])

    const result = await recognizeImage(photo(), cards)

    expect(result).toEqual({
      matches: [{ cardId: 'queen', confidence: 1 }],
      unmatched: ['blah'],
    })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://recognizer:8000/ocr')
    expect((init.body as FormData).get('image')).toBeInstanceOf(File)
  })

  it('reports an unavailable recognizer clearly', async () => {
    vi.stubGlobal('fetch', async () => new Response('boom', { status: 500 }))
    await expect(recognizeImage(photo(), cards)).rejects.toThrow(
      'Card recognition is unavailable'
    )
  })
})
