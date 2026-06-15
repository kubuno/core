// Core UI primitive: a popover that PORTALS to <body> and is fixed-positioned next
// to an anchor element. Use it for menus/pickers that live inside a toolbar with
// `overflow-x-auto` (which forces overflow-y → clipping): an absolutely-positioned
// child would be cut off by that overflow box, but a portal'd fixed element escapes
// it. Position is measured from the anchor and clamped to the viewport on every edge.
import { useState, useRef, useLayoutEffect, useEffect, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

export function AnchoredPopover({
  anchorRef, open, onClose, children, gap = 4, align = 'left',
}: {
  anchorRef: RefObject<HTMLElement | null>
  open: boolean
  onClose: () => void
  children: ReactNode
  gap?: number
  align?: 'left' | 'right'   // align the popover's left or right edge with the anchor
}) {
  const popRef = useRef<HTMLDivElement>(null)
  // null until measured → render hidden for one frame so we can read the true size.
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  const reposition = () => {
    const a = anchorRef.current, p = popRef.current
    if (!a || !p) return
    const r = a.getBoundingClientRect()
    const PW = p.offsetWidth || 232, PH = p.offsetHeight || 300
    const M = 8, vw = window.innerWidth, vh = window.innerHeight
    // Below the anchor by default; flip above if it would go off the bottom.
    let top = r.bottom + gap
    if (top + PH > vh - M) top = r.top - PH - gap
    if (top < M) top = M
    let left = align === 'right' ? r.right - PW : r.left
    if (left + PW > vw - M) left = vw - PW - M
    if (left < M) left = M
    setPos({ left, top })
  }

  useLayoutEffect(() => {
    if (!open) { setPos(null); return }
    reposition()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep it anchored if the window resizes or any ancestor scrolls while open.
  useEffect(() => {
    if (!open) return
    const f = () => reposition()
    window.addEventListener('resize', f)
    window.addEventListener('scroll', f, true)
    return () => { window.removeEventListener('resize', f); window.removeEventListener('scroll', f, true) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null
  return createPortal(
    <>
      <div className="fixed inset-0" style={{ zIndex: 199 }} onMouseDown={onClose} />
      <div ref={popRef} className="fixed"
           style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, zIndex: 200, visibility: pos ? 'visible' : 'hidden' }}>
        {children}
      </div>
    </>,
    document.body,
  )
}
