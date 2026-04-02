import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChangePasswordForm } from '@/components/profile/change-password-form'

function getFieldInput(labelText: string): HTMLInputElement {
  const label = screen.getByText(labelText, { selector: 'label' })
  return label.closest('fieldset')!.querySelector('input')!
}

const mockMutate = vi.fn()
vi.mock('@/lib/auth/queries', () => ({
  changePasswordMutationOptions: () => ({
    mutationKey: ['user', 'changePassword'],
    mutationFn: mockMutate,
  }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    mockMutate.mockReset()
  })

  it('renders current password, new password, and confirm password fields', () => {
    render(<ChangePasswordForm />, { wrapper })
    expect(getFieldInput('Current password')).toBeInTheDocument()
    expect(getFieldInput('New password')).toBeInTheDocument()
    expect(getFieldInput('Repeat new password')).toBeInTheDocument()
  })

  it('shows error when current password is empty on submit', async () => {
    render(<ChangePasswordForm />, { wrapper })
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /change password/i }))

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows error when new password is too short', async () => {
    render(<ChangePasswordForm />, { wrapper })
    const user = userEvent.setup()

    await user.type(getFieldInput('Current password'), 'oldpass')
    await user.type(getFieldInput('New password'), 'short')
    await user.type(getFieldInput('Repeat new password'), 'short')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows mismatch error when confirm password does not match', async () => {
    render(<ChangePasswordForm />, { wrapper })
    const user = userEvent.setup()

    await user.type(getFieldInput('Current password'), 'oldpassword')
    await user.type(getFieldInput('New password'), 'newpassword1')
    await user.type(getFieldInput('Repeat new password'), 'newpassword2')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('calls mutation with currentPassword and newPassword (no confirmPassword) on valid submit', async () => {
    mockMutate.mockResolvedValue(undefined)
    render(<ChangePasswordForm />, { wrapper })
    const user = userEvent.setup()

    await user.type(getFieldInput('Current password'), 'oldpassword')
    await user.type(getFieldInput('New password'), 'newpassword1')
    await user.type(getFieldInput('Repeat new password'), 'newpassword1')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { data: { currentPassword: 'oldpassword', newPassword: 'newpassword1' } },
        expect.any(Object)
      )
    })
    // confirmPassword must not appear in the call
    const callArg = mockMutate.mock.calls[0][0]
    expect(callArg.data).not.toHaveProperty('confirmPassword')
  })
})
