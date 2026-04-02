import { mutationOptions, queryOptions } from '@tanstack/react-query'

import { checkAdminAuth } from '@/app/server/admin'
import {
  changePassword,
  checkAuth,
  getProfile,
  login,
  logout,
  register,
} from '@/app/server/auth'

export const authQueryOptions = () =>
  queryOptions({
    queryKey: ['user'],
    queryFn: ({ signal }) => checkAuth({ signal }),
  })

export const adminQueryOptions = () =>
  queryOptions({
    queryKey: ['admin'],
    queryFn: ({ signal }) => checkAdminAuth({ signal }),
  })

export const loginMutationOptions = () =>
  mutationOptions({
    mutationKey: ['user', 'login'],
    mutationFn: login,
  })

export const logoutMutationOptions = () =>
  mutationOptions({
    mutationKey: ['user', 'logout'],
    mutationFn: logout,
  })

export const registerMutationOptions = () =>
  mutationOptions({
    mutationKey: ['user', 'register'],
    mutationFn: register,
  })

export const profileQueryOptions = () =>
  queryOptions({
    queryKey: ['profile'],
    queryFn: ({ signal }) => getProfile({ signal }),
  })

export const changePasswordMutationOptions = () =>
  mutationOptions({
    mutationKey: ['user', 'changePassword'],
    mutationFn: changePassword,
  })
