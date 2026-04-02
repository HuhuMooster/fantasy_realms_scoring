import type { TSuit } from '@/components/cards/suit-badge'

export interface ICard {
  id: string
  name: string
  suit: TSuit
  basePower: number
  description?: string
}
