import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScanDialog } from '@/components/recognition/scan-dialog'
import type { ICard } from '@/types/cards'

const mockRecognize = vi.fn()
vi.mock('@/app/server/recognition', () => ({
  recognizeCards: (args: unknown) => mockRecognize(args),
}))

const CARDS: ICard[] = [
  { id: 'queen', name: 'Queen', suit: 'leader', basePower: 6 },
  { id: 'king', name: 'King', suit: 'leader', basePower: 8 },
  { id: 'unicorn', name: 'Unicorn', suit: 'beast', basePower: 9 },
]

const photo = new File(['x'], 'hand.jpg', { type: 'image/jpeg' })

beforeEach(() => {
  mockRecognize.mockReset()
})

describe('ScanDialog', () => {
  it('lets the user correct detected cards before confirming', async () => {
    mockRecognize.mockResolvedValue({
      matches: [
        { cardId: 'queen', confidence: 0.9 },
        { cardId: 'unicorn', confidence: 0.4 },
      ],
      unmatched: [],
    })
    const onConfirm = vi.fn()
    const user = userEvent.setup()
    render(<ScanDialog cards={CARDS} editionIds={['base']} onConfirm={onConfirm} />)

    await user.upload(screen.getByLabelText('Photo of cards'), photo)
    await screen.findByText('2 selected')

    // misdetected Unicorn removed, missed King added
    await user.click(screen.getByRole('button', { name: /Unicorn/ }))
    await user.click(screen.getByRole('button', { name: /King/ }))
    await user.click(screen.getByRole('button', { name: 'Use these cards' }))

    expect(onConfirm).toHaveBeenCalledWith(['queen', 'king'])
    expect(screen.queryByRole('button', { name: 'Use these cards' })).toBeNull()
    const fd = mockRecognize.mock.calls[0][0].data as FormData
    expect(fd.get('image')).toBe(photo)
    expect(fd.getAll('editionId')).toEqual(['base'])
  })

  it('never offers excluded cards, even when the photo shows them', async () => {
    mockRecognize.mockResolvedValue({
      matches: [
        { cardId: 'queen', confidence: 0.9 },
        { cardId: 'king', confidence: 0.9 },
      ],
      unmatched: [],
    })
    const onConfirm = vi.fn()
    const user = userEvent.setup()
    render(
      <ScanDialog
        cards={CARDS}
        editionIds={['base']}
        excludedIds={['king']}
        onConfirm={onConfirm}
      />
    )

    await user.upload(screen.getByLabelText('Photo of cards'), photo)
    await screen.findByText('1 selected')
    await user.click(screen.getByRole('button', { name: 'Use these cards' }))

    expect(onConfirm).toHaveBeenCalledWith(['queen'])
  })

  it('blocks confirming more cards than the hand limit until some are removed', async () => {
    mockRecognize.mockResolvedValue({
      matches: CARDS.map((c) => ({ cardId: c.id, confidence: 0.9 })),
      unmatched: [],
    })
    const onConfirm = vi.fn()
    const user = userEvent.setup()
    render(
      <ScanDialog
        cards={CARDS}
        editionIds={['base']}
        maxCards={() => 2}
        onConfirm={onConfirm}
      />
    )

    await user.upload(screen.getByLabelText('Photo of cards'), photo)
    await screen.findByText('Hand limit is 2 cards, remove 1.')
    const confirm = screen.getByRole('button', { name: 'Use these cards' })
    expect(confirm).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /Unicorn/ }))
    expect(screen.queryByText(/Hand limit/)).toBeNull()
    await user.click(confirm)
    expect(onConfirm).toHaveBeenCalledWith(['queen', 'king'])
  })

  it('shows why a scan failed', async () => {
    mockRecognize.mockRejectedValue(new Error('Card recognition is unavailable'))
    const user = userEvent.setup()
    render(<ScanDialog cards={CARDS} editionIds={['base']} onConfirm={vi.fn()} />)

    await user.upload(screen.getByLabelText('Photo of cards'), photo)

    expect(
      await screen.findByText('Card recognition is unavailable')
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Use these cards' })).toBeNull()
  })
})
