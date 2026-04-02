import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginForm } from '@/components/auth/login-form'

// The Input component does not associate labels with inputs via htmlFor/id.
// Find inputs by locating the label text and walking up to the fieldset.
function getFieldInput(labelText: string | RegExp): HTMLInputElement {
  const label = screen.getByText(labelText, { selector: 'label' })
  return label.closest('fieldset')!.querySelector('input')!
}

// Mock router before component imports
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useRouter: () => ({ navigate: vi.fn() }),
}))

// Mock the mutation options so we control what useMutation receives
const mockMutate = vi.fn()
vi.mock('@/lib/auth/queries', () => ({
  loginMutationOptions: () => ({
    mutationKey: ['login'],
    mutationFn: mockMutate,
  }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('LoginForm', () => {
  beforeEach(() => {
    mockMutate.mockReset()
  })

  it('renders username field, password field, and submit button', () => {
    render(<LoginForm />, { wrapper })
    expect(getFieldInput('Username')).toBeInTheDocument()
    expect(getFieldInput('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows username validation error when username is too short', async () => {
    render(<LoginForm />, { wrapper })
    const user = userEvent.setup()

    await user.type(getFieldInput('Username'), 'ab')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows password validation error when password is empty', async () => {
    render(<LoginForm />, { wrapper })
    const user = userEvent.setup()

    await user.type(getFieldInput('Username'), 'validuser')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('calls login mutation with correct data on valid submit', async () => {
    mockMutate.mockResolvedValue({ userId: 'u1', role: 'PLAYER' })
    render(<LoginForm />, { wrapper })
    const user = userEvent.setup()

    await user.type(getFieldInput('Username'), 'validuser')
    await user.type(getFieldInput('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { data: { username: 'validuser', password: 'password123' } },
        expect.any(Object)
      )
    })
  })
})
