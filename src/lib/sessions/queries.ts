import { mutationOptions, queryOptions } from '@tanstack/react-query'

import {
  completeSession,
  createSession,
  deleteSession,
  getSession,
  getSessions,
  submitHand,
} from '@/app/server/sessions'

export const sessionsQueryOptions = () =>
  queryOptions({
    queryKey: ['sessions'],
    queryFn: () => getSessions(),
  })

export const sessionQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['session', id],
    queryFn: () => getSession({ data: { id } }),
  })

export const createSessionMutationOptions = () =>
  mutationOptions({
    mutationFn: createSession,
  })

export const deleteSessionMutationOptions = () =>
  mutationOptions({
    mutationFn: deleteSession,
  })

export const completeSessionMutationOptions = () =>
  mutationOptions({
    mutationFn: completeSession,
  })

export const submitHandMutationOptions = () =>
  mutationOptions({
    mutationFn: submitHand,
  })
