import type { z } from 'zod'

import type { TBonusRule, TCardData } from '@/lib/scoring/types'
import type { actionConfigSchema } from '@/lib/validators'

type TActionConfigs = Record<string, z.infer<typeof actionConfigSchema>>

type TCardRow = {
  id: string
  name: string
  suit: string
  basePower: number
  bonusRule: unknown
}

export function buildHand(rows: TCardRow[]): TCardData[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    suit: r.suit,
    basePower: r.basePower,
    bonusRule: r.bonusRule as TBonusRule,
  }))
}

export function applyActionConfigs(
  hand: TCardData[],
  rowMap: Record<string, TCardRow>,
  actionConfigs: TActionConfigs
): TCardData[] {
  const result = [...hand]

  for (const [actionCardId, cfg] of Object.entries(actionConfigs)) {
    const idx = result.findIndex((c) => c.id === actionCardId)
    if (idx === -1) continue

    if (cfg.type === 'impersonate_deck') {
      const target = rowMap[cfg.targetCardId]
      if (!target) continue
      result[idx] = { ...result[idx], name: target.name, suit: target.suit }
    } else if (cfg.type === 'impersonate_hand') {
      const target = result.find((c) => c.id === cfg.targetCardId)
      if (!target) continue
      result[idx] = {
        ...result[idx],
        name: target.name,
        suit: target.suit,
        basePower: target.basePower,
        bonusRule: target.bonusRule,
      }
    } else if (cfg.type === 'book_of_changes') {
      const targetIdx = result.findIndex((c) => c.id === cfg.targetCardId)
      if (targetIdx === -1 || !cfg.newSuit) continue
      result[targetIdx] = { ...result[targetIdx], suit: cfg.newSuit }
    } else if (cfg.type === 'island') {
      const targetIdx = result.findIndex((c) => c.id === cfg.targetCardId)
      if (targetIdx === -1) continue
      result[targetIdx] = { ...result[targetIdx], penaltiesCleared: true }
    } else if (cfg.type === 'angel') {
      const targetIdx = result.findIndex((c) => c.id === cfg.targetCardId)
      if (targetIdx === -1) continue
      result[targetIdx] = { ...result[targetIdx], blankedProtected: true }
    }
  }

  return result
}
