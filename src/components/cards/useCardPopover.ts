import { useEffect, useRef, useState } from 'react'

export interface IPopoverPos {
  top: number
  left: number
  width: number
}

const POPOVER_WIDTH = 280
const POPOVER_GAP = 10

function computeHoverPos(el: HTMLElement): IPopoverPos {
  const rect = el.getBoundingClientRect()
  const rightX = rect.right + POPOVER_GAP
  const leftX = rect.left - POPOVER_WIDTH - POPOVER_GAP
  const left = rightX + POPOVER_WIDTH <= window.innerWidth ? rightX : leftX
  return { top: rect.top, left, width: POPOVER_WIDTH }
}

export function useCardPopover() {
  const anchorRef = useRef<HTMLElement | null>(null)
  const [pos, setPos] = useState<IPopoverPos | null>(null)

  function showHover() {
    const el = anchorRef.current
    if (!el) return
    setPos(computeHoverPos(el))
  }

  function hide() {
    setPos(null)
  }

  useEffect(() => {
    if (!pos) return
    function onScroll() {
      hide()
    }
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [pos])

  return { anchorRef, pos, showHover, hide }
}
