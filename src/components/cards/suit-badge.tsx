import { cn } from '@/lib/utils'

export type TSuit =
  | 'flame'
  | 'flood'
  | 'weather'
  | 'land'
  | 'undead'
  | 'army'
  | 'leader'
  | 'artifact'
  | 'beast'
  | 'wizard'
  | 'weapon'
  | 'wild'
  | 'building'
  | 'outsider'
  | 'cursed-item'

export const ALL_SUITS: readonly TSuit[] = [
  'army',
  'artifact',
  'beast',
  'building',
  'cursed-item',
  'flame',
  'flood',
  'land',
  'leader',
  'outsider',
  'undead',
  'weapon',
  'weather',
  'wild',
  'wizard',
] as const

export const SUIT_COLORS: Record<TSuit, { bg: string; text: string }> = {
  land: { bg: '#3b1d13', text: '#ffffff' },
  flood: { bg: '#41437c', text: '#ffffff' },
  weather: { bg: '#a6bced', text: '#1a1a1a' },
  flame: { bg: '#b44347', text: '#ffffff' },
  army: { bg: '#312b2f', text: '#ffffff' },
  wizard: { bg: '#e056a3', text: '#ffffff' },
  leader: { bg: '#7b48a4', text: '#ffffff' },
  beast: { bg: '#60a35c', text: '#ffffff' },
  weapon: { bg: '#878586', text: '#ffffff' },
  artifact: { bg: '#d24e37', text: '#ffffff' },
  wild: { bg: '#c6c2c3', text: '#1a1a1a' },
  building: { bg: '#463153', text: '#ffffff' },
  outsider: { bg: '#fba934', text: '#1a1a1a' },
  undead: { bg: '#004e4a', text: '#ffffff' },
  'cursed-item': { bg: '#900c3f', text: '#ffffff' },
}

interface ISuitBadgeProps {
  suit: TSuit
  className?: string
}

export function getSuitColors(suit: string): { bg: string; text: string } {
  return SUIT_COLORS[suit as TSuit] ?? { bg: '#888888', text: '#ffffff' }
}

export function getSuitShortLabel(suit: string): string {
  return suit.split('-')[0].replace(/^\w/, (c) => c.toUpperCase())
}

export function SuitBadge({ suit, className = '' }: ISuitBadgeProps) {
  const colors = getSuitColors(suit)
  const label = getSuitShortLabel(suit)

  return (
    <span
      style={{ backgroundColor: colors.bg, color: colors.text }}
      className={cn('badge badge-sm w-16 justify-center border-0', className)}
    >
      {label}
    </span>
  )
}
