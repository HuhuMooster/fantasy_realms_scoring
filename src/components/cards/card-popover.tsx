import { createPortal } from 'react-dom'

import { highlightDescription } from '@/components/cards/highlight-description'
import { SuitBadge } from '@/components/cards/suit-badge'
import type { TSuit } from '@/components/cards/suit-badge'
import type { IPopoverPos } from '@/components/cards/useCardPopover'

export function CardPopoverPortal({
  name,
  suit,
  basePower,
  description,
  pos,
}: {
  name: string
  suit: TSuit
  basePower: number
  description: string
  pos: IPopoverPos
}) {
  return createPortal(
    <div
      style={{ top: pos.top, left: pos.left, width: pos.width }}
      className="hidden md:block fixed z-100 pointer-events-none
        bg-base-200 border border-primary rounded-xl shadow-2xl p-4 space-y-2"
    >
      <div className="flex items-center gap-2">
        <SuitBadge suit={suit} className="shrink-0" />
        <span className="font-bold text-sm leading-tight flex-1">{name}</span>
        <span className="font-bold text-primary text-base shrink-0">{basePower}</span>
      </div>
      <p className="text-xs text-base-content/80 leading-relaxed">
        {highlightDescription(description)}
      </p>
    </div>,
    document.body
  )
}
