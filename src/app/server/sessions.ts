import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

import { requireUser } from '@/app/server/_requireAuth'
import { db } from '@/db/db'
import { cards } from '@/db/schema/cards'
import { handCards } from '@/db/schema/hand-cards'
import { sessionEditions } from '@/db/schema/session-editions'
import { sessionPlayers } from '@/db/schema/session-players'
import { sessions } from '@/db/schema/sessions'
import { scoreHand } from '@/lib/scoring/engine'
import { applyActionConfigs, buildHand } from '@/lib/scoring/handUtils'
import { createSessionSchema, submitHandSchema } from '@/lib/validators'

export const getSessions = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await requireUser()

  const sessionRows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.createdBy, user.sub))
    .orderBy(desc(sessions.createdAt))

  if (sessionRows.length === 0) return []

  const playerRows = await db
    .select()
    .from(sessionPlayers)
    .where(
      inArray(
        sessionPlayers.sessionId,
        sessionRows.map((s) => s.id)
      )
    )

  return sessionRows.map((s) => ({
    ...s,
    players: playerRows.filter((p) => p.sessionId === s.id),
  }))
})

export const getSession = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const user = await requireUser()

    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, data.id), eq(sessions.createdBy, user.sub)))
      .limit(1)
    if (!session) throw new Error('Session not found')

    const players = await db
      .select()
      .from(sessionPlayers)
      .where(eq(sessionPlayers.sessionId, data.id))

    const editionRows = await db
      .select({ editionId: sessionEditions.editionId })
      .from(sessionEditions)
      .where(eq(sessionEditions.sessionId, data.id))

    const handCardRows =
      players.length > 0
        ? await db
            .select()
            .from(handCards)
            .where(
              inArray(
                handCards.sessionPlayerId,
                players.map((p) => p.id)
              )
            )
        : []

    return {
      ...session,
      editionIds: editionRows.map((e) => e.editionId),
      players: players.map((p) => ({
        ...p,
        cardIds: handCardRows
          .filter((hc) => hc.sessionPlayerId === p.id)
          .map((hc) => hc.cardId),
      })),
    }
  })

export const createSession = createServerFn({ method: 'POST' })
  .inputValidator(createSessionSchema)
  .handler(async ({ data }) => {
    const user = await requireUser()

    const [session] = await db
      .insert(sessions)
      .values({ name: data.name, createdBy: user.sub })
      .returning()

    await db
      .insert(sessionEditions)
      .values(
        data.editionIds.map((editionId) => ({ sessionId: session.id, editionId }))
      )

    await db
      .insert(sessionPlayers)
      .values(data.nicknames.map((nickname) => ({ sessionId: session.id, nickname })))

    return { id: session.id }
  })

export const submitHand = createServerFn({ method: 'POST' })
  .inputValidator(submitHandSchema)
  .handler(async ({ data }) => {
    const user = await requireUser()

    const [player] = await db
      .select()
      .from(sessionPlayers)
      .where(eq(sessionPlayers.id, data.sessionPlayerId))
      .limit(1)
    if (!player) throw new Error('Player not found')

    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, player.sessionId), eq(sessions.createdBy, user.sub)))
      .limit(1)
    if (!session) throw new Error('Not authorized')

    // Replace hand cards
    await db
      .delete(handCards)
      .where(eq(handCards.sessionPlayerId, data.sessionPlayerId))

    if (data.cardIds.length > 0) {
      await db.insert(handCards).values(
        data.cardIds.map((cardId) => ({
          sessionPlayerId: data.sessionPlayerId,
          cardId,
        }))
      )
    }

    // Calculate and persist score
    const { actionConfigs = {} } = data

    const cardRows =
      data.cardIds.length > 0
        ? await db.select().from(cards).where(inArray(cards.id, data.cardIds))
        : []

    const rowMap = Object.fromEntries(cardRows.map((r) => [r.id, r]))

    const deckTargetIds = Object.values(actionConfigs)
      .filter((c) => c.type === 'impersonate_deck')
      .map((c) => c.targetCardId)
      .filter((id) => !rowMap[id])

    if (deckTargetIds.length > 0) {
      const extra = await db
        .select()
        .from(cards)
        .where(inArray(cards.id, deckTargetIds))
      for (const r of extra) rowMap[r.id] = r
    }

    const hand = applyActionConfigs(buildHand(cardRows), rowMap, actionConfigs)

    const result = scoreHand(hand)

    await db
      .update(sessionPlayers)
      .set({ finalScore: result.totalScore })
      .where(eq(sessionPlayers.id, data.sessionPlayerId))

    return { score: result.totalScore }
  })

export const completeSession = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const user = await requireUser()

    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, data.id), eq(sessions.createdBy, user.sub)))
      .limit(1)
    if (!session) throw new Error('Session not found')

    await db
      .update(sessions)
      .set({ status: 'COMPLETED', updatedAt: new Date() })
      .where(eq(sessions.id, data.id))
  })

export const deleteSession = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const user = await requireUser()

    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, data.id), eq(sessions.createdBy, user.sub)))
      .limit(1)
    if (!session) throw new Error('Session not found')

    await db.delete(sessions).where(eq(sessions.id, data.id))
  })
