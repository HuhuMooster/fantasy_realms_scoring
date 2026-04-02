import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Suspense } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionForm } from '@/components/sessions/session-form'

function getFieldInput(labelText: string): HTMLInputElement {
  const label = screen.getByText(labelText, { selector: 'label' })
  return label.closest('fieldset')!.querySelector('input')!
}

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ navigate: vi.fn() }),
}))

const mockCreateMutate = vi.fn()
vi.mock('@/lib/sessions/queries', () => ({
  createSessionMutationOptions: () => ({
    mutationKey: ['createSession'],
    mutationFn: mockCreateMutate,
  }),
}))

const EDITIONS = [
  { id: 'base-id', name: 'Base Game', slug: 'base' },
  { id: 'promo-id', name: 'Promo Cards', slug: 'promo' },
]

vi.mock('@/lib/cards/queries', () => ({
  editionsQueryOptions: () => ({
    queryKey: ['editions'],
    queryFn: () => Promise.resolve(EDITIONS),
  }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  })
  // Pre-populate the editions cache so useSuspenseQuery resolves immediately
  client.setQueryData(['editions'], EDITIONS)
  return (
    <QueryClientProvider client={client}>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </QueryClientProvider>
  )
}

describe('SessionForm', () => {
  beforeEach(() => {
    mockCreateMutate.mockReset()
  })

  it('renders with 2 player inputs by default', async () => {
    render(<SessionForm />, { wrapper })
    await waitFor(() => screen.getByRole('button', { name: /create game/i }))
    const inputs = screen.getAllByPlaceholderText(/player \d+ nickname/i)
    expect(inputs).toHaveLength(2)
  })

  it('add player button appends a third input', async () => {
    render(<SessionForm />, { wrapper })
    const user = userEvent.setup()

    await waitFor(() => screen.getByRole('button', { name: /add player/i }))
    await user.click(screen.getByRole('button', { name: /add player/i }))

    const inputs = screen.getAllByPlaceholderText(/player \d+ nickname/i)
    expect(inputs).toHaveLength(3)
  })

  it('remove button is absent when exactly 2 players remain', async () => {
    render(<SessionForm />, { wrapper })
    await waitFor(() => screen.getByRole('button', { name: /create game/i }))
    expect(screen.queryByRole('button', { name: /remove player/i })).toBeNull()
  })

  it('remove button appears when 3 players exist', async () => {
    render(<SessionForm />, { wrapper })
    const user = userEvent.setup()

    await waitFor(() => screen.getByRole('button', { name: /add player/i }))
    await user.click(screen.getByRole('button', { name: /add player/i }))

    expect(screen.getAllByRole('button', { name: /remove player/i })).toHaveLength(3)
  })

  it('shows form error when name is empty on submit', async () => {
    render(<SessionForm />, { wrapper })
    const user = userEvent.setup()

    // Wait for form to appear (Suspense resolves)
    await waitFor(() => screen.getByRole('button', { name: /create game/i }))
    await user.click(screen.getByRole('button', { name: /create game/i }))

    await waitFor(() => {
      expect(screen.getByText(/enter a game name/i)).toBeInTheDocument()
    })
    expect(mockCreateMutate).not.toHaveBeenCalled()
  })

  it('shows error when no player names are filled in', async () => {
    render(<SessionForm />, { wrapper })
    const user = userEvent.setup()

    await waitFor(() => screen.getByRole('button', { name: /create game/i }))
    await user.type(getFieldInput('Game name'), 'My Game')
    await user.click(screen.getByRole('button', { name: /create game/i }))

    await waitFor(() => {
      expect(screen.getByText(/add at least one player/i)).toBeInTheDocument()
    })
  })

  it('base edition checkbox is disabled', async () => {
    render(<SessionForm />, { wrapper })
    await waitFor(() => screen.getByText('Base Game'))
    const baseLabel = screen.getByText('Base Game').closest('label')!
    const baseCheckbox = within(baseLabel).getByRole('checkbox')
    expect(baseCheckbox).toBeDisabled()
  })

  it('base edition checkbox is checked by default', async () => {
    render(<SessionForm />, { wrapper })
    await waitFor(() => screen.getByText('Base Game'))
    const baseLabel = screen.getByText('Base Game').closest('label')!
    const baseCheckbox = within(baseLabel).getByRole('checkbox')
    expect(baseCheckbox).toBeChecked()
  })

  it('non-base edition checkbox toggles on click', async () => {
    render(<SessionForm />, { wrapper })
    const user = userEvent.setup()
    await waitFor(() => screen.getByText('Promo Cards'))

    const promoLabel = screen.getByText('Promo Cards').closest('label')!
    const promoCheckbox = within(promoLabel).getByRole('checkbox')

    expect(promoCheckbox).not.toBeChecked()
    await user.click(promoCheckbox)
    expect(promoCheckbox).toBeChecked()
    await user.click(promoCheckbox)
    expect(promoCheckbox).not.toBeChecked()
  })

  it('calls createSession mutation with trimmed filled nicknames only', async () => {
    mockCreateMutate.mockResolvedValue({ id: 'session-1' })
    render(<SessionForm />, { wrapper })
    const user = userEvent.setup()

    await waitFor(() => screen.getByRole('button', { name: /create game/i }))
    await user.type(getFieldInput('Game name'), '  Friday Night  ')
    const inputs = screen.getAllByPlaceholderText(/player \d+ nickname/i)
    await user.type(inputs[0], 'Alice')
    await user.type(inputs[1], 'Bob')
    await user.click(screen.getByRole('button', { name: /create game/i }))

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Friday Night',
            nicknames: ['Alice', 'Bob'],
            editionIds: ['base-id'],
          }),
        }),
        expect.any(Object)
      )
    })
  })

  it('filters out empty nickname slots before submitting', async () => {
    mockCreateMutate.mockResolvedValue({ id: 'session-1' })
    render(<SessionForm />, { wrapper })
    const user = userEvent.setup()

    await waitFor(() => screen.getByRole('button', { name: /create game/i }))
    await user.type(getFieldInput('Game name'), 'Game')
    await user.click(screen.getByRole('button', { name: /add player/i }))

    const inputs = screen.getAllByPlaceholderText(/player \d+ nickname/i)
    await user.type(inputs[0], 'Alice')
    // inputs[1] left empty
    await user.type(inputs[2], 'Charlie')
    await user.click(screen.getByRole('button', { name: /create game/i }))

    await waitFor(() => {
      const callData = mockCreateMutate.mock.calls[0][0].data
      expect(callData.nicknames).toEqual(['Alice', 'Charlie'])
    })
  })
})
