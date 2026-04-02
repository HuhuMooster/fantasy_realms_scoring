import { mutationOptions, queryOptions } from '@tanstack/react-query'

import {
  createInviteCode,
  deleteInviteCode,
  getAdminInvites,
  getAdminUsers,
} from '@/app/server/admin'

export const adminUsersQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'users'],
    queryFn: () => getAdminUsers(),
  })

export const adminInvitesQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'invites'],
    queryFn: () => getAdminInvites(),
  })

export const createInviteCodeMutationOptions = () =>
  mutationOptions({
    mutationFn: () => createInviteCode(),
  })

export const deleteInviteCodeMutationOptions = () =>
  mutationOptions({
    mutationFn: deleteInviteCode,
  })
