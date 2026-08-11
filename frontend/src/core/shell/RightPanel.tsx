import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink, GripVertical, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useRightPanelStore } from '../store/rightPanelStore'
import { appIdFromPath, panelPrefs, RIGHT_PANEL_WIDTH } from '../store/panelPrefs'

/* Below this viewport width the panel stops taking its share of the row and floats
 * over the content instead. Pushing at 320px+ out of a 1100px window leaves the
 * message list too narrow to read — the same reasoning that turns the data table
 * into cards. Above it, side by side stays the more useful arrangement. */
const OVERLAY_BELOW = 1280

export default function RightPanel() {
  const { t } = useTranslation()
  const { entries, activeModuleId, closePanel } = useRightPanelStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const appId = appIdFromPath(pathname)

  const activeEntry = entries.find((e) => e.moduleId === activeModuleId)
  const isOpen = activeModuleId !== null && activeEntry != null

  // ── Width: restored per application, clamped, remembered on release ─────────
  const [width, setWidth] = useState<number>(RIGHT_PANEL_WIDTH.DEFAULT)
  useEffect(() => {
    const saved = panelPrefs.get(appId).rightWidth
    setWidth(saved ?? RIGHT_PANEL_WIDTH.DEFAULT)
  }, [appId])

  const drag = useRef<{ x: number; w: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const applyWidth = useCallback((next: number) => {
    setWidth(Math.max(RIGHT_PANEL_WIDTH.MIN, Math.min(RIGHT_PANEL_WIDTH.MAX, Math.round(next))))
  }, [])

  // Pointer events with capture, exactly like the left sidebar's handle: the drag
  // survives the cursor leaving the 12px strip, which it does immediately.
  const onResizeDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    drag.current = { x: e.clientX, w: Number(document.documentElement.dataset.kbRightW) || RIGHT_PANEL_WIDTH.DEFAULT }
    setDragging(true)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }, [])

  const onResizeMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    // The joint is on the panel's LEFT edge: dragging left WIDENS it, so the delta
    // is inverted compared with the left sidebar.
    applyWidth(d.w - (e.clientX - d.x))
  }, [applyWidth])

  const endResize = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return
    drag.current = null
    setDragging(false)
    // Releasing an already-lost capture throws in some engines, and this also runs
    // from `onLostPointerCapture` where the capture is gone by definition.
    try { (e.target as Element).releasePointerCapture?.(e.pointerId) } catch { /* already released */ }
    panelPrefs.setRightWidth(appId, Number(document.documentElement.dataset.kbRightW) || RIGHT_PANEL_WIDTH.DEFAULT)
  }, [appId])

  // Mirror the live width where the mouseup handler can read it without being
  // recreated on every pixel (the listener closes over a stale `width` otherwise).
  useEffect(() => { document.documentElement.dataset.kbRightW = String(width) }, [width])

  // ── Overlay vs push ────────────────────────────────────────────────────────
  const [overlay, setOverlay] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < OVERLAY_BELOW)
  useEffect(() => {
    const onResize = () => setOverlay(window.innerWidth < OVERLAY_BELOW)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Escape closes the floating panel — it covers the content, so it must be
  // dismissible the way every other overlay in the app is.
  useEffect(() => {
    if (!isOpen || !overlay) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, overlay, closePanel])

  const chromeBtn =
    'flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary transition-colors ' +
    'hover:bg-surface-2 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'

  return (
    <>
      {isOpen && overlay && (
        <div
          data-app-chrome
          className="fixed inset-0 z-40 bg-black/20"
          onClick={closePanel}
          aria-hidden
        />
      )}

      <div
        data-right-panel
        data-overlay={overlay ? '' : undefined}
        /* No `overflow-hidden` here: the resize handle lives OUTSIDE this box
           (`right-full`, in the gutter) and would be clipped away by it. This element
           only sizes and positions; the visible card below does the clipping. */
        className={clsx(
          'flex flex-shrink-0 flex-col',
          overlay
            ? 'fixed bottom-1 right-16 top-16 z-50 shadow-[0_6px_18px_rgb(0_0_0/25%)]'
            // The width transition animates the OPEN/CLOSE, but during a drag it makes
            // every pixel lag 200ms behind the cursor — the handle then stutters and the
            // line appears to flicker. Off while dragging.
            : dragging ? 'relative' : 'relative transition-[width] duration-200 ease-in-out',
          // 16px of air between the central area and the panel. The row already puts a
          // 4px gap between its children, so 12px here lands exactly on 16 — and only
          // when the panel is actually open, otherwise a closed panel would leave a
          // 16px hole against the rail.
          !overlay && isOpen && 'ml-3',
        )}
        style={{
          width: isOpen ? width : 0,
          // A floating panel that is closed must not intercept clicks on the content.
          ...(overlay && !isOpen ? { display: 'none' } : null),
        }}
      >
        {isOpen && activeEntry && (
          <>
            {/* Resize joint — the SAME control as the left sidebar's, mirrored: it sits
                just OUTSIDE the panel (`right-full`), in the 16px gutter between the
                central area and the panel, rather than tight against the card. Hidden
                while floating: the panel is then detached from the row and dragging its
                edge means nothing. */}
            {!overlay && (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label={t('shell.resize_panel', { defaultValue: 'Redimensionner le panneau' })}
                onPointerDown={onResizeDown}
                onPointerMove={onResizeMove}
                onPointerUp={endResize}
                onPointerCancel={endResize}
                /* Safety net: a capture lost for any other reason (window blur, the node
                   being re-parented) would otherwise leave the panel stuck in the
                   dragging state — blue line, and no open/close animation any more. */
                onLostPointerCapture={endResize}
                onDoubleClick={() => { applyWidth(RIGHT_PANEL_WIDTH.DEFAULT); panelPrefs.setRightWidth(appId, RIGHT_PANEL_WIDTH.DEFAULT) }}
                /* `right-full` alone butts the 12px strip against the panel, leaving it 2px
                   off the centre of the 16px gutter. `mr-[2px]` pushes it onto the
                   exact middle: (16 - 12) / 2 = 2 on each side. */
                className="group absolute top-0 right-full mr-[2px] hidden h-full w-3 cursor-col-resize lg:block z-[60]"
              >
                {/* Hairline — discreet at rest, tinted on hover and while dragging. */}
                <div className={`absolute inset-y-0 left-1/2 w-[5px] -translate-x-1/2 rounded-full transition-colors
                                ${dragging ? 'bg-primary' : 'bg-transparent group-hover:bg-border'}`} />
                {/* Grip pill — invisible at rest, materialises as the pointer approaches. */}
                <div className={`absolute left-1/2 top-1/2 flex h-9 w-3.5 -translate-x-1/2 -translate-y-1/2
                                items-center justify-center rounded-full border bg-surface-0 shadow-sm transition
                                ${dragging
                                  ? 'border-primary/40 bg-primary-light text-primary opacity-100'
                                  : 'border-border text-text-tertiary opacity-0 group-hover:opacity-100'}`}>
                  <GripVertical size={13} />
                </div>
              </div>
            )}

            {/* The visible card: white surface, rounded corners, and the clipping. */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl"
                 style={{ background: 'var(--color-surface-0)' }}>
            {/* Panel section title: 14px bold, no forced caps and no letter-spacing. */}
            <div className="flex h-11 flex-shrink-0 items-center gap-1 border-b border-border/60 px-4">
              <span className="flex-1 truncate text-sm font-bold text-text-secondary">
                {activeEntry.label}
              </span>
              {activeEntry.openPath && (
                <button
                  type="button"
                  onClick={() => navigate(activeEntry.openPath!)}
                  className={chromeBtn}
                  aria-label={t('shell.open')}
                >
                  <ExternalLink size={15} />
                </button>
              )}
              <button type="button" onClick={closePanel} className={chromeBtn} aria-label={t('common.close')}>
                <X size={15} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <activeEntry.panelComponent />
            </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
