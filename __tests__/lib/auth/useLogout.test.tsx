import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useLogout } from '@/lib/auth/useLogout'

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ navigate: mockNavigate }),
}))

const mockLogoutFn = vi.fn()
vi.mock('@/lib/auth/queries', () => ({
  logoutMutationOptions: () => ({
    mutationKey: ['logout'],
    mutationFn: mockLogoutFn,
  }),
  authQueryOptions: () => ({ queryKey: ['user'] }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useLogout', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockLogoutFn.mockReset()
  })

  it('exposes logout function and isPending flag', () => {
    const { result } = renderHook(() => useLogout(), { wrapper })
    expect(typeof result.current.logout).toBe('function')
    expect(result.current.isPending).toBe(false)
  })

  it('calls the logout mutation when logout() is invoked', async () => {
    mockLogoutFn.mockResolvedValue(undefined)
    const { result } = renderHook(() => useLogout(), { wrapper })

    await act(async () => {
      result.current.logout()
    })

    expect(mockLogoutFn).toHaveBeenCalled()
  })

  it('navigates to / after successful logout', async () => {
    mockLogoutFn.mockResolvedValue(undefined)
    const { result } = renderHook(() => useLogout(), { wrapper })

    await act(async () => {
      result.current.logout()
      // wait for mutation to resolve
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
  })
})
