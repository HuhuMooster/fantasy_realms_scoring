import { getCookie } from '@tanstack/react-start/server'

import { verifyJWT } from '@/lib/auth/auth'

export async function requireUser() {
  const token = getCookie('token')
  if (!token) throw new Error('Unauthorized')
  const user = await verifyJWT(token)
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'ADMIN') throw new Error('Forbidden')
  return user
}
