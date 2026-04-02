import { create } from 'zustand'

import type { TActionConfig } from '@/lib/calculator/actions'
import { EXTRA_CARD_NAMES } from '@/lib/calculator/actions'

const BASE_MAX_HAND = 7

interface ICalculatorState {
  activeEditionIds: string[]
  selectedCardIds: string[]
  actionConfigs: Record<string, TActionConfig>
  toggleEdition: (id: string) => void
  addCard: (id: string) => void
  removeCard: (id: string) => void
  clearHand: () => void
  setActionConfig: (cardId: string, config: TActionConfig | null) => void
}

export function calcMaxHand(cardNames: string[]): number {
  const extras = cardNames.filter((n) => EXTRA_CARD_NAMES.has(n)).length
  return BASE_MAX_HAND + Math.min(extras, 1)
}

export const useCalculatorStore = create<ICalculatorState>((set) => ({
  activeEditionIds: [],
  selectedCardIds: [],
  actionConfigs: {},

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
}))
