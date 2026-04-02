import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { authQueryOptions, logoutMutationOptions } from '@/lib/auth/queries'

export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    ...logoutMutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authQueryOptions().queryKey })
      router.navigate({ to: '/' })
    },
  })

  return {
    logout: () => mutation.mutate({}),
    isPending: mutation.isPending,
  }
}
