/**
 * The scrolling window of a virtualised `@ui` list (`ListBox`, `CheckedListBox`, `ListView`, `TreeView`): the
 * viewport is measured, only the rows in it (plus a margin) are rendered, and a row brought into focus by the
 * keyboard is scrolled into view. Fixed row height.
 */
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import { scrollToShow, visibleRange } from './listCore'

export interface VirtualList {
  /** The scroll container. */
  ref: (el: HTMLElement | null) => void
  onScroll: (e: React.UIEvent<HTMLElement>) => void
  /** The rows to render (`end` exclusive). */
  start: number
  end: number
  /** The viewport height, in rows (Page Up / Page Down). */
  pageRows: number
  /** Scrolls so that row `index` shows. */
  reveal: (index: number) => void
}

export function useVirtualList(count: number, rowHeight: number, header = 0): VirtualList {
  const el = useRef<HTMLElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(0)
  const observer = useRef<ResizeObserver | null>(null)
  const ref = useCallback((node: HTMLElement | null) => {
    observer.current?.disconnect()
    el.current = node
    if (!node) return
    setViewport(node.clientHeight)
    if (typeof ResizeObserver !== 'undefined') {
      observer.current = new ResizeObserver(() => setViewport(node.clientHeight))
      observer.current.observe(node)
    }
  }, [])
  useLayoutEffect(() => () => observer.current?.disconnect(), [])
  const onScroll = useCallback((e: React.UIEvent<HTMLElement>) => setScrollTop(e.currentTarget.scrollTop), [])
  const reveal = useCallback((index: number) => {
    const node = el.current
    if (!node || index < 0) return
    const next = scrollToShow(index, node.scrollTop, node.clientHeight, rowHeight, header)
    if (next !== node.scrollTop) {
      node.scrollTop = next
      setScrollTop(next)
    }
  }, [rowHeight, header])
  const { start, end } = visibleRange(Math.max(0, scrollTop - header), Math.max(0, viewport - header), rowHeight, count)
  return { ref, onScroll, start, end, pageRows: Math.max(1, Math.floor((viewport - header) / rowHeight) - 1), reveal }
}
