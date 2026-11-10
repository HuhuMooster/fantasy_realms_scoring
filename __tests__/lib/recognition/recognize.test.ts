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

const photo = (type = 'image/jpeg', size = 10) =>
  new File([new Uint8Array(size)], 'hand.jpg', { type })

afterEach(() => vi.unstubAllGlobals())

describe('recognizeImage', () => {
  it('sends the photo to the recognizer and matches the returned text to cards', async () => {
    const fetchMock = fakeRecognizer([
      { text: 'Queen', confidence: 1 },
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

  it.each([
    ['a non-image file', photo('application/pdf')],
    ['an image over 10 MB', photo('image/jpeg', 10 * 1024 * 1024 + 1)],
  ])('rejects %s without calling the recognizer', async (_, file) => {
    const fetchMock = fakeRecognizer([])
    await expect(recognizeImage(file, cards)).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports an unavailable recognizer clearly', async () => {
    vi.stubGlobal('fetch', async () => new Response('boom', { status: 500 }))
    await expect(recognizeImage(photo(), cards)).rejects.toThrow(
      'Card recognition is unavailable'
    )
  })
})
