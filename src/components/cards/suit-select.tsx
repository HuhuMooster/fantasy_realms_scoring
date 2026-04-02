import { ALL_SUITS } from '@/components/cards/suit-badge'
import { cn, formatSuitName } from '@/lib/utils'

interface ISuitSelectProps {
  value: string
  onChange: (suit: string) => void
  className?: string
}

export function SuitSelect({ value, onChange, className = '' }: ISuitSelectProps) {
  return (
    <select
      className={cn('select select-bordered select-xs sm:select-md w-auto', className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{'All suits'}</option>
      {ALL_SUITS.map((s) => (
        <option key={s} value={s}>
          {formatSuitName(s)}
        </option>
      ))}
    </select>
  )
}
