import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'
import z from 'zod'

import { requireAdmin } from '@/app/server/_requireAuth'
import { db } from '@/db/db'
import { inviteCodes } from '@/db/schema/invite-codes'
import { users } from '@/db/schema/users'

const genCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8)

export const checkAdminAuth = createServerFn({ method: 'GET' }).handler(async () => {
  return await requireAdmin()
})

export const getAdminUsers = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin()
  return db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
})

export const getAdminInvites = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin()

  const rows = await db
    .select({
      id: inviteCodes.id,
      code: inviteCodes.code,
      createdAt: inviteCodes.createdAt,
      usedAt: inviteCodes.usedAt,
      usedBy: inviteCodes.usedBy,
    })
    .from(inviteCodes)
    .orderBy(desc(inviteCodes.createdAt))

  // Resolve usernames for used codes
  const usedByIds = [...new Set(rows.map((r) => r.usedBy).filter(Boolean) as string[])]
  let usernameMap: Record<string, string> = {}
  if (usedByIds.length > 0) {
    const { inArray } = await import('drizzle-orm')
    const resolvedUsers = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(inArray(users.id, usedByIds))
    usernameMap = Object.fromEntries(resolvedUsers.map((u) => [u.id, u.username]))
  }

  return rows.map((r) => ({
    ...r,
    usedByUsername: r.usedBy ? (usernameMap[r.usedBy] ?? r.usedBy) : null,
  }))
})

export const createInviteCode = createServerFn({ method: 'POST' }).handler(async () => {
  const admin = await requireAdmin()
  const code = genCode()
  const [row] = await db
    .insert(inviteCodes)
    .values({ code, createdBy: admin.sub })
    .returning()
  return row
})

const deleteCodeSchema = z.object({ id: z.string() })

export const deleteInviteCode = createServerFn({ method: 'POST' })
  .inputValidator(deleteCodeSchema)
  .handler(async ({ data: { id } }) => {
    await requireAdmin()

    const [row] = await db.delete(inviteCodes).where(eq(inviteCodes.id, id)).returning()
    return row
  })
