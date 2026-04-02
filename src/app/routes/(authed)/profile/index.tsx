import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { ChangePasswordForm } from '@/components/profile/change-password-form'
import { profileQueryOptions } from '@/lib/auth/queries'
import { formatDate } from '@/lib/utils'

export const Route = createFileRoute('/(authed)/profile/')({
  beforeLoad: async ({ context }) => {
    await context.queryClient.prefetchQuery(profileQueryOptions())
  },
  component: ProfilePage,
})

function ProfilePage() {
  const { data: profile } = useSuspenseQuery(profileQueryOptions())

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">{'Profile'}</h1>

      <div className="card bg-base-100 mb-8 shadow-sm shadow-primary">
        <div className="card-body gap-3">
          <div className="flex justify-between items-center">
            <span className="text-base-content/60">{'Username'}</span>
            <span className="font-medium">{profile.username}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-base-content/60">{'Member since'}</span>
            <span className="font-medium">{formatDate(profile.createdAt)}</span>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">{'Change password'}</h2>
      <ChangePasswordForm />
    </div>
  )
}
