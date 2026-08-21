import { create } from 'zustand'

import type { TActionConfig } from '@/lib/calculator/actions'
import { EXTRA_CARD_NAMES } from '@/lib/calculator/actions'

const BASE_MAX_HAND = 7
const DEFAULT_PLAYER_COUNT = 4

interface ICalculatorState {
  activeEditionIds: string[]
  selectedCardIds: string[]
  actionConfigs: Record<string, TActionConfig>
  discardCardIds: string[]
  playerCount: number
  toggleEdition: (id: string) => void
  addCard: (id: string) => void
  removeCard: (id: string) => void
  clearHand: () => void
  setActionConfig: (cardId: string, config: TActionConfig | null) => void
  toggleDiscardCard: (id: string) => void
  setPlayerCount: (count: number) => void
}

// Base hand size is 7; the Cursed Hoard suits edition (Buildings, Outsiders &
// Undead) raises that to 8 regardless of hand contents; a card with
// extraCard: true (Necromancer, Genie, Leprechaun, Portal) raises it by one
// more, to 8 or 9. Cursed items are never counted against this limit -- they
// live in their own unlimited pool (enforced in CardPicker, not here).
export function calcMaxHand(
  cardNames: string[],
  cursedHoardSuitsActive: boolean
): number {
  const defaultLimit = BASE_MAX_HAND + (cursedHoardSuitsActive ? 1 : 0)
  const hasExtraCard = cardNames.some((n) => EXTRA_CARD_NAMES.has(n))
  return defaultLimit + (hasExtraCard ? 1 : 0)
}

export const useCalculatorStore = create<ICalculatorState>((set) => ({
  activeEditionIds: [],
  selectedCardIds: [],
  actionConfigs: {},
  discardCardIds: [],
  playerCount: DEFAULT_PLAYER_COUNT,

  toggleEdition: (id) =>
    set((s) => ({
      activeEditionIds: s.activeEditionIds.includes(id)
        ? s.activeEditionIds.filter((x) => x !== id)
        : [...s.activeEditionIds, id],
    })),

  addCard: (id) =>
    set((s) =>
      s.selectedCardIds.includes(id)
        ? s
        : { selectedCardIds: [...s.selectedCardIds, id] }
    ),

  removeCard: (id) =>
    set((s) => {
      const selectedCardIds = s.selectedCardIds.filter((x) => x !== id)
      const actionConfigs = { ...s.actionConfigs }
      delete actionConfigs[id]
      for (const [key, cfg] of Object.entries(actionConfigs)) {
        if ('targetCardId' in cfg && cfg.targetCardId === id) {
          delete actionConfigs[key]
        }
      }
      return { selectedCardIds, actionConfigs }
    }),

  clearHand: () => set({ selectedCardIds: [], actionConfigs: {} }),

  setActionConfig: (cardId, config) =>
    set((s) => {
      const actionConfigs = { ...s.actionConfigs }
      if (config === null) {
        delete actionConfigs[cardId]
      } else {
        actionConfigs[cardId] = config
      }
      return { actionConfigs }
    }),

  toggleDiscardCard: (id) =>
    set((s) => ({
      discardCardIds: s.discardCardIds.includes(id)
        ? s.discardCardIds.filter((x) => x !== id)
        : [...s.discardCardIds, id],
    })),

  setPlayerCount: (count) => set({ playerCount: count }),
}))
