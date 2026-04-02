import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { adminUsersQueryOptions } from '@/lib/admin/queries'
import { cn, formatDate } from '@/lib/utils'

export const Route = createFileRoute('/(authed)/admin/users')({
  beforeLoad: async ({ context }) => {
    await context.queryClient.prefetchQuery(adminUsersQueryOptions())
  },
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const { data: users } = useSuspenseQuery(adminUsersQueryOptions())

  return (
    <div>
      <p className="text-sm text-base-content/50 mb-3">
        {users.length}
        {' registered users'}
      </p>
      <div className="card bg-base-100 p-4 shadow-sm shadow-primary overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>{'Username'}</th>
              <th>{'Role'}</th>
              <th>{'Joined'}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.username}</td>
                <td>
                  <span
                    className={cn(
                      'badge badge-sm',
                      u.role === 'ADMIN' ? 'badge-primary' : 'badge-ghost'
                    )}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="text-base-content/50 text-xs">
                  {formatDate(u.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
