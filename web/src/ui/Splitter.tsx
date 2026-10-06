import React, { useEffect, useRef, useState } from 'react'

import { cn } from './cn'

export interface SplitterProps {
  /** Exactly two panes; more are ignored. */
  children?: React.ReactNode
  /** `vertical`: panes side by side (a vertical bar); `horizontal`: one above the other. */
  orientation?: 'vertical' | 'horizontal'
  /** Size of the first pane in px (controlled when given and followed through `onDistanceChange`). */
  distance?: number
  onDistanceChange?: (distance: number) => void
  /** Smallest size of either pane, px. */
  minPane?: number
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

/** Keeps the first pane between `min` and `size − min` (and ≥ 0 when the container is too small). */
export function clampDistance(d: number, size: number, min: number): number {
  const hi = Math.max(0, size - min)
  return Math.round(Math.max(Math.min(min, hi), Math.min(d, hi)))
}

/** The arrow-key step of the bar: 10 px, 50 with Shift. */
export const SPLITTER_STEP = 10

/**
 * Two panes and a bar between them (the `.kbview` `Splitter`). The bar is a focusable `role="separator"` with its
 * value (`aria-valuenow`, the first pane's size): drag it, or use the arrow keys (Shift: bigger steps), Home / End.
 * Side by side, the first pane is at the reading start (it mirrors in RTL).
 */
export const Splitter = React.forwardRef<HTMLDivElement, SplitterProps>(function Splitter(
  { children, orientation = 'vertical', distance = 200, onDistanceChange, minPane = 48, className, style, ...aria },
  ref,
) {
  const [own, setOwn] = useState(distance)
  useEffect(() => setOwn(distance), [distance])
  const box = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState(0)
  const side = orientation === 'vertical'
  useEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setSize(side ? el.clientWidth : el.clientHeight)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [side])
  const d = size ? clampDistance(own, size - 6, minPane) : own
  const set = (v: number) => {
    const c = size ? clampDistance(v, size - 6, minPane) : Math.max(0, Math.round(v))
    if (c === d) return
    setOwn(c)
    onDistanceChange?.(c)
  }
  const rtl = () => !!box.current && getComputedStyle(box.current).direction === 'rtl'
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const bar = e.currentTarget
    bar.setPointerCapture(e.pointerId)
    const start = side ? e.clientX : e.clientY
    const from = d
    const flip = side && rtl() ? -1 : 1
    const move = (ev: PointerEvent) => set(from + flip * ((side ? ev.clientX : ev.clientY) - start))
    const up = () => { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up) }
    bar.addEventListener('pointermove', move)
    bar.addEventListener('pointerup', up)
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? SPLITTER_STEP * 5 : SPLITTER_STEP
    const flip = side && rtl() ? -1 : 1
    const grow = side ? (flip > 0 ? 'ArrowRight' : 'ArrowLeft') : 'ArrowDown'
    const shrink = side ? (flip > 0 ? 'ArrowLeft' : 'ArrowRight') : 'ArrowUp'
    if (e.key === grow) set(d + step)
    else if (e.key === shrink) set(d - step)
    else if (e.key === 'Home') set(0)
    else if (e.key === 'End') set(Number.MAX_SAFE_INTEGER)
    else return
    e.preventDefault()
  }
  const panes = React.Children.toArray(children).slice(0, 2)
  const setRefs = (el: HTMLDivElement | null) => {
    box.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }
  return (
    <div
      ref={setRefs}
      className={cn('flex min-w-0 min-h-0', side ? 'flex-row' : 'flex-col', className)}
      style={style}
    >
      <div className="min-w-0 min-h-0 overflow-auto flex-shrink-0" style={side ? { width: d } : { height: d }}>{panes[0]}</div>
      <div
        role="separator"
        tabIndex={0}
        aria-orientation={side ? 'vertical' : 'horizontal'}
        aria-valuenow={d}
        aria-valuemin={0}
        aria-valuemax={size ? Math.max(0, size - 6 - minPane) : undefined}
        aria-label={aria['aria-label']}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        className={cn(
          'group relative flex-shrink-0 flex items-center justify-center outline-none touch-none',
          side ? 'w-1.5 cursor-ew-resize' : 'h-1.5 cursor-ns-resize',
          'focus-visible:ring-2 focus-visible:ring-primary',
        )}
      >
        <span className={cn('rounded-full bg-border group-hover:bg-primary/40 transition-colors', side ? 'w-[3px] h-full' : 'h-[3px] w-full')} />
      </div>
      <div className="min-w-0 min-h-0 overflow-auto flex-1">{panes[1]}</div>
    </div>
  )
})

Splitter.displayName = 'Splitter'
