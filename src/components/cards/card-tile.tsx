import { useState } from 'react'

import { CardPopoverPortal } from '@/components/cards/card-popover'
import { highlightDescription } from '@/components/cards/highlight-description'
import { SuitBadge } from '@/components/cards/suit-badge'
import type { TSuit } from '@/components/cards/suit-badge'
import { useCardPopover } from '@/components/cards/useCardPopover'
import { cn } from '@/lib/utils'
import type { ICard } from '@/types/cards'

interface ICardTileProps extends ICard {
  onClick?: () => void
  selected?: boolean
  compact?: boolean
  disabled?: boolean
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function CardTile({
  name,
  suit,
  basePower,
  description,
  onClick,
  selected = false,
  compact = false,
  disabled = false,
}: ICardTileProps) {
  const { anchorRef, pos, showHover, hide } = useCardPopover()
  const [expanded, setExpanded] = useState(false)

  const hoverProps = description ? { onMouseEnter: showHover, onMouseLeave: hide } : {}

  function toggleExpand(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setExpanded((ex) => !ex)
  }

  if (compact) {
    return (
      <>
        <div
          ref={anchorRef as React.RefObject<HTMLDivElement>}
          {...hoverProps}
          className={cn(
            'w-full rounded-lg border transition-colors',
            disabled ? 'opacity-40' : 'hover:border-primary',
            selected ? 'border-primary ring-1 ring-primary' : 'border-base-300'
          )}
        >
          {/* Main row button -- pick the card */}
          <button
            type="button"
            onClick={onClick}
            className={cn(
              'flex items-center gap-2 w-full px-4 py-0.5 text-left',
              expanded ? 'rounded-t-lg' : 'rounded-lg',
              disabled ? 'cursor-not-allowed' : 'cursor-pointer',
              selected ? 'bg-primary/5' : 'bg-base-100'
            )}
          >
            <SuitBadge suit={suit} className="shrink-0" />
            <span className="flex-1 text-sm font-medium truncate">{name}</span>
            <span className="text-sm font-bold text-base-content/60 shrink-0">
              {basePower}
            </span>
            {description && (
              <span
                onClick={toggleExpand}
                className="shrink-0 p-1 -mr-1 rounded text-base-content/40 hover:text-base-content transition-colors"
                aria-label={expanded ? 'Collapse' : 'Expand'}
              >
                <ChevronIcon
                  className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    expanded && 'rotate-180'
                  )}
                />
              </span>
            )}
          </button>

          {/* Accordion */}
          {expanded && description && (
            <div
              className={cn(
                'px-3 pb-3 pt-2 text-xs text-base-content/80 leading-relaxed rounded-b-lg',
                selected
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-base-100 border-base-300'
              )}
            >
              {highlightDescription(description)}
            </div>
          )}
        </div>

        {pos && description && (
          <CardPopoverPortal
            name={name}
            suit={suit as TSuit}
            basePower={basePower}
            description={description}
            pos={pos}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div
        ref={anchorRef as React.RefObject<HTMLDivElement>}
        {...hoverProps}
        className={cn(
          'card card-compact bg-base-100 border transition-all w-full',
          disabled ? 'opacity-40' : '',
          selected ? 'border-primary ring-2 ring-primary' : 'border-base-300'
        )}
      >
        {/* Main card body button -- pick the card */}
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'card-body gap-1 p-3 text-left w-full',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
          )}
        >
          <SuitBadge suit={suit} className="self-start" />
          <span className="font-semibold text-sm leading-tight line-clamp-2">
            {name}
          </span>
          <div className="flex items-end justify-between mt-auto">
            <span />
            <p className="text-xl font-bold text-base-content/70">{basePower}</p>
          </div>
        </button>

        {/* Chevron toggle */}
        {description && (
          <div className="flex justify-end px-2 pb-1 border-base-300">
            <button
              type="button"
              onClick={toggleExpand}
              className="p-1 text-base-content/40 hover:text-base-content transition-colors"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              <ChevronIcon
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  expanded && 'rotate-180'
                )}
              />
            </button>
          </div>
        )}

        {/* Accordion */}
        {expanded && description && (
          <div className="px-3 pb-3 text-xs text-base-content/80 leading-relaxed border-base-300">
            {highlightDescription(description)}
          </div>
        )}
      </div>

      {pos && description && (
        <CardPopoverPortal
          name={name}
          suit={suit as TSuit}
          basePower={basePower}
          description={description}
          pos={pos}
        />
      )}
    </>
  )
}
