import { createServerFn } from '@tanstack/react-start'
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'
import { and, eq, isNull } from 'drizzle-orm'

import { ipRateLimit, userRateLimit } from '@/app/server/_rateLimit'
import { requireUser } from '@/app/server/_requireAuth'
import { db } from '@/db/db'
import { inviteCodes } from '@/db/schema/invite-codes'
import { users } from '@/db/schema/users'
import { env } from '@/env'
import { comparePassword, hashPassword, signJWT, verifyJWT } from '@/lib/auth/auth'
import { changePasswordSchema, loginSchema, registerSchema } from '@/lib/validators'

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  secure: env.NODE_ENV === 'production',
}

export const checkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const token = getCookie('token')
  if (!token) return null

  return verifyJWT(token)
})

export const login = createServerFn({ method: 'POST' })
  .middleware([ipRateLimit('login', 10, 15 * 60 * 1000)])
  .inputValidator(loginSchema)
  .handler(async ({ data }) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username))
    if (!user) throw new Error('Invalid credentials')

    const valid = await comparePassword(data.password, user.passwordHash)
    if (!valid) throw new Error('Invalid credentials')

    const token = await signJWT({ sub: user.id, role: user.role })
    setCookie('token', token, COOKIE_OPTS)

    return { userId: user.id, role: user.role }
  })

export const register = createServerFn({ method: 'POST' })
  .middleware([ipRateLimit('register', 5, 60 * 60 * 1000)])
  .inputValidator(registerSchema)
  .handler(async ({ data }) => {
    // Check invite code
    const [invite] = await db
      .select()
      .from(inviteCodes)
      .where(and(eq(inviteCodes.code, data.inviteCode), isNull(inviteCodes.usedAt)))
    if (!invite) throw new Error('Invalid or already used invite code')

    // Check username taken
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username))
    if (existing) throw new Error('Username already taken')

    const passwordHash = await hashPassword(data.password)

    const [user] = await db
      .insert(users)
      .values({ username: data.username, passwordHash, role: 'PLAYER' })
      .returning()

    // Mark invite used
    await db
      .update(inviteCodes)
      .set({ usedAt: new Date(), usedBy: user.id })
      .where(eq(inviteCodes.id, invite.id))

    const token = await signJWT({ sub: user.id, role: user.role })
    setCookie('token', token, COOKIE_OPTS)

    return { userId: user.id, role: user.role }
  })

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  deleteCookie('token')
})

export const getProfile = createServerFn({ method: 'GET' }).handler(async () => {
  const jwtUser = await requireUser()
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, jwtUser.sub))
    .limit(1)
  if (!user) throw new Error('User not found')
  return user
})

export const changePassword = createServerFn({ method: 'POST' })
  .middleware([userRateLimit('changePassword', 5, 15 * 60 * 1000)])
  .inputValidator(changePasswordSchema)
  .handler(async ({ data, context }) => {
    const jwtUser = context.user

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, jwtUser.sub))
      .limit(1)
    if (!user) throw new Error('User not found')

    const valid = await comparePassword(data.currentPassword, user.passwordHash)
    if (!valid) throw new Error('Current password is incorrect')

    const passwordHash = await hashPassword(data.newPassword)
    await db.update(users).set({ passwordHash }).where(eq(users.id, user.id))
  })
