import type { TTheme } from '@/components/theme/types'

export const THEMES: Array<{ id: TTheme; label: string }> = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'synthwave', label: 'Synthwave' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'night', label: 'Night' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'cupcake', label: 'Cupcake' },
  { id: 'nord', label: 'Nord' },
  { id: 'business', label: 'Business' },
] as const
