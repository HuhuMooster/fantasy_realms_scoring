import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCardPopover } from '@/components/cards/useCardPopover'

function makeFakeEl(rect: Partial<DOMRect> = {}) {
  return {
    getBoundingClientRect: () => ({
      top: 100,
      left: 200,
      right: 480,
      bottom: 150,
      width: 280,
      height: 50,
      x: 200,
      y: 100,
      toJSON: () => ({}),
      ...rect,
    }),
  } as unknown as HTMLElement
}

beforeEach(() => {
  // jsdom default innerWidth is 1024
  Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
})

describe('useCardPopover', () => {
  it('starts with pos null', () => {
    const { result } = renderHook(() => useCardPopover())
    expect(result.current.pos).toBeNull()
  })

  it('sets pos after showHover when anchorRef has an element', () => {
    const { result } = renderHook(() => useCardPopover())
    const fakeEl = makeFakeEl({ right: 480 })

    act(() => {
      // Assign the ref manually
      ;(result.current.anchorRef as React.MutableRefObject<HTMLElement>).current =
        fakeEl
      result.current.showHover()
    })

    expect(result.current.pos).not.toBeNull()
    expect(result.current.pos).toMatchObject({ top: 100, width: 280 })
  })

  it('places popover to the right when there is enough room', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
    const { result } = renderHook(() => useCardPopover())
    // right=480, rightX = 480+10=490, 490+280=770 <= 1024 => goes right
    const fakeEl = makeFakeEl({ right: 480, top: 50 })

    act(() => {
      ;(result.current.anchorRef as React.MutableRefObject<HTMLElement>).current =
        fakeEl
      result.current.showHover()
    })

    expect(result.current.pos!.left).toBe(490)
  })

  it('places popover to the left when right side would overflow', () => {
    Object.defineProperty(window, 'innerWidth', { value: 600, writable: true })
    const { result } = renderHook(() => useCardPopover())
    // right=480, rightX=490, 490+280=770 > 600 => goes left
    // leftX = left(200)-280-10 = -90
    const fakeEl = makeFakeEl({ right: 480, left: 200 })

    act(() => {
      ;(result.current.anchorRef as React.MutableRefObject<HTMLElement>).current =
        fakeEl
      result.current.showHover()
    })

    expect(result.current.pos!.left).toBe(-90)
  })

  it('hide() sets pos back to null', () => {
    const { result } = renderHook(() => useCardPopover())
    const fakeEl = makeFakeEl()

    act(() => {
      ;(result.current.anchorRef as React.MutableRefObject<HTMLElement>).current =
        fakeEl
      result.current.showHover()
    })

    expect(result.current.pos).not.toBeNull()

    act(() => {
      result.current.hide()
    })

    expect(result.current.pos).toBeNull()
  })

  it('a scroll event hides the popover', () => {
    const { result } = renderHook(() => useCardPopover())
    const fakeEl = makeFakeEl()

    act(() => {
      ;(result.current.anchorRef as React.MutableRefObject<HTMLElement>).current =
        fakeEl
      result.current.showHover()
    })

    expect(result.current.pos).not.toBeNull()

    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    expect(result.current.pos).toBeNull()
  })

  it('does nothing on showHover when anchorRef.current is null', () => {
    const { result } = renderHook(() => useCardPopover())

    act(() => {
      result.current.showHover()
    })

    expect(result.current.pos).toBeNull()
  })
})
