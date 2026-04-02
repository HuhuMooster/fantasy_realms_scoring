import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RegisterForm } from '@/components/auth/register-form'

function getFieldInput(labelText: string | RegExp): HTMLInputElement {
  const label = screen.getByText(labelText, { selector: 'label' })
  return label.closest('fieldset')!.querySelector('input')!
}

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useRouter: () => ({ navigate: vi.fn() }),
}))

const mockMutate = vi.fn()
vi.mock('@/lib/auth/queries', () => ({
  registerMutationOptions: () => ({
    mutationKey: ['register'],
    mutationFn: mockMutate,
  }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('RegisterForm', () => {
  beforeEach(() => {
    mockMutate.mockReset()
  })

  it('renders all three fields', () => {
    render(<RegisterForm />, { wrapper })
    expect(getFieldInput('Username')).toBeInTheDocument()
    expect(getFieldInput('Password')).toBeInTheDocument()
    expect(getFieldInput('Invite Code')).toBeInTheDocument()
  })

  it('shows error when username contains special characters', async () => {
    render(<RegisterForm />, { wrapper })
    const user = userEvent.setup()

    await user.type(getFieldInput('Username'), 'hello!')
    await user.type(getFieldInput('Password'), 'password123')
    await user.type(getFieldInput('Invite Code'), 'ABCD1234')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/only letters, numbers, underscores/i)
      ).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows error when invite code is not 8 characters', async () => {
    render(<RegisterForm />, { wrapper })
    const user = userEvent.setup()

    await user.type(getFieldInput('Username'), 'validuser')
    await user.type(getFieldInput('Password'), 'password123')
    await user.type(getFieldInput('Invite Code'), 'SHORT')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/8-character code required/i)).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('calls register mutation with correct data on valid submit', async () => {
    mockMutate.mockResolvedValue({ userId: 'u1', role: 'PLAYER' })
    render(<RegisterForm />, { wrapper })
    const user = userEvent.setup()

    await user.type(getFieldInput('Username'), 'newuser')
    await user.type(getFieldInput('Password'), 'password123')
    await user.type(getFieldInput('Invite Code'), 'ABCD1234')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        {
          data: {
            username: 'newuser',
            password: 'password123',
            inviteCode: 'ABCD1234',
          },
        },
        expect.any(Object)
      )
    })
  })

  it('shows username length error when username is too short', async () => {
    render(<RegisterForm />, { wrapper })
    const user = userEvent.setup()

    await user.type(getFieldInput('Username'), 'ab')
    await user.type(getFieldInput('Password'), 'password123')
    await user.type(getFieldInput('Invite Code'), 'ABCD1234')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument()
    })
  })
})
