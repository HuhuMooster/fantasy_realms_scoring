import { createId } from '@paralleldrive/cuid2'
import bcrypt from 'bcryptjs'
import { and, eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import {
  BASE_CARDS,
  CURSED_HOARD_ITEMS_CARDS,
  CURSED_HOARD_NEW_CARDS,
  type TCardDef,
} from '@/db/cardDefs'
import { cards } from '@/db/schema/cards'
import { editions } from '@/db/schema/editions'
import { inviteCodes } from '@/db/schema/invite-codes'
import { sessionEditions } from '@/db/schema/session-editions'
import { users } from '@/db/schema/users'
import { env } from '@/env'

const ADMIN_USERNAME = env.ADMIN_USERNAME
const ADMIN_PASSWORD = env.ADMIN_PASSWORD
const INITIAL_INVITE = env.INITIAL_INVITE_CODE

const client = postgres(env.DATABASE_URL, { max: 1 })
const db = drizzle(client)

// jsonb round-trips through Postgres don't preserve object key order, so a
// plain JSON.stringify diff between a freshly-read bonusRule and a literal
// def would report a "change" on every reseed even when nothing differs.
// Sort keys recursively before comparing.
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    )
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------
;(async () => {
  // ---------- Admin user (idempotent) ----------
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, ADMIN_USERNAME))
  let adminId: string
  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
    adminId = createId()
    await db.insert(users).values({
      id: adminId,
      username: ADMIN_USERNAME,
      passwordHash,
      role: 'ADMIN',
    })
    console.log(`Admin user '${ADMIN_USERNAME}' created.`)
    await db.insert(inviteCodes).values({ code: INITIAL_INVITE, createdBy: adminId })
    console.log(`Invite code '${INITIAL_INVITE}' created.`)
  } else {
    adminId = existing[0].id
    console.log('Admin user already exists, skipping user seed.')
  }

  // ---------- Editions ----------
  // Upserts an edition by slug. If `legacySlug` is given and no edition with
  // `slug` exists yet, an edition still sitting under the old `legacySlug` is
  // renamed in place (preserving its id) instead of creating a duplicate --
  // this is how the old combined 'cursed-hoard' edition becomes the
  // 'cursed-hoard-cards' ("Buildings, Outsiders & Undead") edition without
  // orphaning any cards/sessions that already reference it.
  async function upsertEdition(
    slug: string,
    name: string,
    displayOrder: number,
    legacySlug?: string
  ): Promise<{ id: string; migratedFromLegacy: boolean }> {
    const rows = await db.select().from(editions).where(eq(editions.slug, slug))
    if (rows.length > 0) return { id: rows[0].id, migratedFromLegacy: false }

    if (legacySlug) {
      const legacyRows = await db
        .select()
        .from(editions)
        .where(eq(editions.slug, legacySlug))
      if (legacyRows.length > 0) {
        await db
          .update(editions)
          .set({ slug, name, displayOrder })
          .where(eq(editions.id, legacyRows[0].id))
        console.log(`Edition '${legacySlug}' migrated to '${slug}' ('${name}').`)
        return { id: legacyRows[0].id, migratedFromLegacy: true }
      }
    }

    const [ed] = await db
      .insert(editions)
      .values({ slug, name, displayOrder })
      .returning()
    console.log(`Edition '${name}' created.`)
    return { id: ed.id, migratedFromLegacy: false }
  }

  const { id: baseEditionId } = await upsertEdition('base', 'Base Game', 1)
  const { id: chCardsEditionId, migratedFromLegacy } = await upsertEdition(
    'cursed-hoard-cards',
    'Buildings, Outsiders & Undead',
    2,
    'cursed-hoard'
  )
  const { id: chItemsEditionId } = await upsertEdition(
    'cursed-hoard-items',
    'Cursed Items',
    3
  )

  // ---------- Migrate legacy combined 'cursed-hoard' edition ----------
  // The old edition held both the new-suit cards and the cursed-item cards
  // together. Move the cursed-item cards (and any sessions that used them)
  // onto the new dedicated edition, by id, so existing hands/scores stay intact.
  if (migratedFromLegacy) {
    const strandedItemCards = await db
      .select()
      .from(cards)
      .where(and(eq(cards.editionId, chCardsEditionId), eq(cards.suit, 'cursed-item')))

    if (strandedItemCards.length > 0) {
      await db
        .update(cards)
        .set({ editionId: chItemsEditionId })
        .where(
          inArray(
            cards.id,
            strandedItemCards.map((c) => c.id)
          )
        )
      console.log(
        `Moved ${strandedItemCards.length} Cursed Item cards to the 'Cursed Items' edition.`
      )
    }

    const legacySessionLinks = await db
      .select({ sessionId: sessionEditions.sessionId })
      .from(sessionEditions)
      .where(eq(sessionEditions.editionId, chCardsEditionId))

    if (legacySessionLinks.length > 0) {
      await db.insert(sessionEditions).values(
        legacySessionLinks.map((l) => ({
          sessionId: l.sessionId,
          editionId: chItemsEditionId,
        }))
      )
      console.log(
        `Linked ${legacySessionLinks.length} existing session(s) to the 'Cursed Items' edition.`
      )
    }
  }

  // ---------- Cards (upsert by name per edition) ----------
  // Updates in place (by name) rather than delete+reinsert so that card ids
  // stay stable across reseeds -- hand_cards/discard_cards reference
  // cards.id with no onDelete cascade, so a blind delete would either fail
  // or orphan existing sessions' hands.
  async function seedCards(defs: TCardDef[], editionId: string, label: string) {
    const existingRows = await db
      .select()
      .from(cards)
      .where(eq(cards.editionId, editionId))
    const existingByName = new Map(existingRows.map((r) => [r.name, r]))

    let inserted = 0
    let updated = 0
    for (const def of defs) {
      const existing = existingByName.get(def.name)
      if (!existing) {
        await db.insert(cards).values({
          name: def.name,
          suit: def.suit,
          basePower: def.basePower,
          editionId,
          bonusRule: def.bonusRule as object,
          description: def.description,
        })
        inserted++
        continue
      }

      existingByName.delete(def.name)
      const changed =
        existing.suit !== def.suit ||
        existing.basePower !== def.basePower ||
        existing.description !== def.description ||
        stableStringify(existing.bonusRule) !== stableStringify(def.bonusRule)

      if (changed) {
        await db
          .update(cards)
          .set({
            suit: def.suit,
            basePower: def.basePower,
            bonusRule: def.bonusRule as object,
            description: def.description,
          })
          .where(eq(cards.id, existing.id))
        updated++
      }
    }

    const staleIds = [...existingByName.values()].map((r) => r.id)
    if (staleIds.length > 0) {
      await db.delete(cards).where(inArray(cards.id, staleIds))
    }

    console.log(
      `${label}: ${inserted} inserted, ${updated} updated, ${staleIds.length} removed (${defs.length} total).`
    )
  }

  await seedCards(BASE_CARDS, baseEditionId, 'Base Game')
  await seedCards(
    CURSED_HOARD_NEW_CARDS,
    chCardsEditionId,
    'Cursed Hoard: Buildings, Outsiders & Undead'
  )
  await seedCards(
    CURSED_HOARD_ITEMS_CARDS,
    chItemsEditionId,
    'Cursed Hoard: Cursed Items'
  )

  await client.end()
})()
