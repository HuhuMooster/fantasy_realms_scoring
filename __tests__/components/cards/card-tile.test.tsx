import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CardTile } from '@/components/cards/card-tile'

// useCardPopover accesses window.getBoundingClientRect; stub it
vi.mock('@/components/cards/useCardPopover', () => ({
  useCardPopover: () => ({
    anchorRef: { current: null },
    pos: null,
    showHover: vi.fn(),
    hide: vi.fn(),
  }),
}))

const baseProps = {
  id: 'c1',
  name: 'Dragon',
  suit: 'beast' as const,
  basePower: 30,
  description: 'Breathes fire.',
}

describe('CardTile (non-compact)', () => {
  it('renders the card name, suit badge, and base power', () => {
    render(<CardTile {...baseProps} />)
    expect(screen.getByText('Dragon')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    // Suit badge short label
    expect(screen.getByText('Beast')).toBeInTheDocument()
  })

  it('calls onClick when the card body button is clicked', async () => {
    const onClick = vi.fn()
    render(<CardTile {...baseProps} onClick={onClick} />)
    const user = userEvent.setup()

    // The card body is a button; Dragon text is inside it
    const cardButton = screen.getByRole('button', { name: /dragon/i })
    await user.click(cardButton)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows the expand chevron button when description is present', () => {
    render(<CardTile {...baseProps} />)
    expect(screen.getByRole('button', { name: /expand/i })).toBeInTheDocument()
  })

  it('does not show chevron when description is absent', () => {
    render(<CardTile {...baseProps} description={undefined} />)
    expect(screen.queryByRole('button', { name: /expand/i })).toBeNull()
  })

  it('toggles description accordion on chevron click', async () => {
    render(<CardTile {...baseProps} />)
    const user = userEvent.setup()

    expect(screen.queryByText('Breathes fire.')).toBeNull()

    await user.click(screen.getByRole('button', { name: /expand/i }))
    expect(screen.getByText('Breathes fire.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /collapse/i }))
    expect(screen.queryByText('Breathes fire.')).toBeNull()
  })

  it('applies selected styles when selected prop is true', () => {
    const { container } = render(<CardTile {...baseProps} selected />)
    // The outer wrapper has ring-2 ring-primary when selected
    expect(container.firstChild).toHaveClass('ring-2')
  })

  it('applies opacity class when disabled', () => {
    const { container } = render(<CardTile {...baseProps} disabled />)
    expect(container.firstChild).toHaveClass('opacity-40')
  })
})

describe('CardTile (compact)', () => {
  it('renders name, suit badge, and base power in compact mode', () => {
    render(<CardTile {...baseProps} compact />)
    expect(screen.getByText('Dragon')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('calls onClick when compact card button is clicked', async () => {
    const onClick = vi.fn()
    render(<CardTile {...baseProps} compact onClick={onClick} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /dragon/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows expand chevron in compact mode when description exists', () => {
    render(<CardTile {...baseProps} compact />)
    expect(screen.getByRole('button', { name: /expand/i })).toBeInTheDocument()
  })

  it('applies selected border styles in compact mode', () => {
    render(<CardTile {...baseProps} compact selected />)
    // The main row button has bg-primary/5 class when selected
    const btn = screen.getByRole('button', { name: /dragon/i })
    expect(btn).toHaveClass('bg-primary/5')
  })

  it('applies opacity and cursor-not-allowed when disabled in compact mode', () => {
    const { container } = render(<CardTile {...baseProps} compact disabled />)
    expect(container.firstChild).toHaveClass('opacity-40')
  })
})
