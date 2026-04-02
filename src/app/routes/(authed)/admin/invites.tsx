import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import {
  adminInvitesQueryOptions,
  createInviteCodeMutationOptions,
  deleteInviteCodeMutationOptions,
} from '@/lib/admin/queries'
import { cn, formatDate } from '@/lib/utils'

export const Route = createFileRoute('/(authed)/admin/invites')({
  beforeLoad: async ({ context }) => {
    await context.queryClient.prefetchQuery(adminInvitesQueryOptions())
  },
  component: AdminInvitesPage,
})

function AdminInvitesPage() {
  const queryClient = useQueryClient()
  const [newCode, setNewCode] = useState<string | null>(null)

  const { data: invites } = useSuspenseQuery(adminInvitesQueryOptions())

  const createMutation = useMutation({
    ...createInviteCodeMutationOptions(),
    onSuccess: (result) => {
      setNewCode(result.code)
      queryClient.invalidateQueries({ queryKey: adminInvitesQueryOptions().queryKey })
    },
  })

  const deleteMutation = useMutation({
    ...deleteInviteCodeMutationOptions(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminInvitesQueryOptions().queryKey }),
  })

  const available = invites.filter((i) => !i.usedAt).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-base-content/50">
          {invites.length}
          {' total '}
          {available}
          {' available'}
        </p>
        <button
          type="button"
          className="btn btn-primary btn-xs sm:btn-sm"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            '+ New code'
          )}
        </button>
      </div>

      {newCode && (
        <div className="alert alert-success mb-4 py-2 text-sm">
          {'New code: '}
          <span className="font-mono font-bold ml-1">{newCode}</span>
        </div>
      )}

      <div className="card bg-base-100 p-4 shadow-sm shadow-primary overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>{'Code'}</th>
              <th>{'Status'}</th>
              <th>{'Used by'}</th>
              <th>{'Created'}</th>
              <th>{'Action'}</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((inv) => (
              <tr key={inv.id}>
                <td className="font-mono font-medium">{inv.code}</td>
                <td>
                  <span
                    className={cn(
                      'badge badge-sm',
                      inv.usedAt ? 'badge-ghost' : 'badge-success'
                    )}
                  >
                    {inv.usedAt ? 'used' : 'available'}
                  </span>
                </td>
                <td className="text-base-content/60 text-sm">
                  {inv.usedByUsername ?? '-'}
                </td>
                <td className="text-base-content/50 text-xs">
                  {formatDate(inv.createdAt)}
                </td>
                <td className="text-base-content/50 text-xs">
                  <button
                    className={cn(
                      'btn btn-ghost btn-xs text-error',
                      inv.usedAt !== null &&
                        'cursor-not-allowed opacity-60 line-through'
                    )}
                    onClick={() => deleteMutation.mutate({ data: { id: inv.id } })}
                    disabled={inv.usedAt !== null || deleteMutation.isPending}
                  >
                    {'✕'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
