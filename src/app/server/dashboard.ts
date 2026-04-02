import { createServerFn } from '@tanstack/react-start'
import { desc, eq, inArray } from 'drizzle-orm'

import { requireUser } from '@/app/server/_requireAuth'
import { db } from '@/db/db'
import { sessionPlayers } from '@/db/schema/session-players'
import { sessions } from '@/db/schema/sessions'
import { users } from '@/db/schema/users'

export const getDashboardData = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await requireUser()

  const [userRow] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1)

  const allSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.createdBy, user.sub))
    .orderBy(desc(sessions.createdAt))

  const completedCount = allSessions.filter((s) => s.status === 'COMPLETED').length

  const recentSessions = allSessions.slice(0, 5)
  const recentIds = recentSessions.map((s) => s.id)

  const playerRows =
    recentIds.length > 0
      ? await db
          .select()
          .from(sessionPlayers)
          .where(inArray(sessionPlayers.sessionId, recentIds))
      : []

  const recent = recentSessions.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    date: s.date,
    playerCount: playerRows.filter((p) => p.sessionId === s.id).length,
  }))

  return {
    username: userRow?.username ?? '',
    totalSessions: allSessions.length,
    completedSessions: completedCount,
    recent,
  }
})
