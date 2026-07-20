import { useRef, useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { SquareArrowOutUpRight, X } from 'lucide-react'
import { useWindowZStore } from './windowZStore'
import { useIsMobile } from './interaction'
import { usePortalHost } from './portalHost'

// Injected by the desktop client: opens (or refocuses) a real OS window on a SPA
// route, served by the local proxy. Absent on the plain web.
declare global {
  interface Window {
    kubunoDesktop?: {
      openWindow: (
        route: string,
        label?: string,
        opts?: { width?: number; height?: number },
      ) => Promise<void>
    }
  }
}

interface FloatingWindowProps {
  // Contenu
  title:         string | React.ReactNode
  icon?:         React.ReactNode
  children:      React.ReactNode
  titleActions?: React.ReactNode   // boutons à droite du titre (avant le ×)

  // Pop-out desktop : quand le client desktop est présent (window.kubunoDesktop),
  // affiche un bouton ↗ « Détacher » qui ouvre `route` dans une vraie fenêtre OS
  // puis ferme ce panneau. Sur le web classique, rien ne change.
  popout?:       { route: string; label?: string; width?: number; height?: number; auto?: boolean }

  // Fermeture
  onClose:       () => void

  // Taille
  defaultWidth?:  number           // défaut : 560
  defaultHeight?: number           // défaut : libre (content-driven)
  minWidth?:      number           // défaut : 280
  minHeight?:     number           // défaut : 120

  // Comportement
  resizable?:    boolean           // défaut : false
  backdrop?:     boolean           // défaut : false — overlay semi-transparent
  className?:    string            // classes CSS additionnelles sur la fenêtre
}

export function FloatingWindow({
  title,
  icon,
  children,
  titleActions,
  popout,
  onClose,
  defaultWidth  = 560,
  defaultHeight,
  minWidth      = 280,
  minHeight     = 120,
  resizable     = false,
  backdrop      = false,
  className     = '',
}: FloatingWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null)
  const [zIndex, setZIndex] = useState(() => useWindowZStore.getState().next())
  // Hauteur « verrouillée » des fenêtres À ONGLETS dont la taille est pilotée par le
  // contenu : la fenêtre se cale sur l'onglet le plus HAUT et ne rétrécit jamais en
  // changeant d'onglet (0 = pas encore de verrou / fenêtre non tabulée).
  const [lockedH, setLockedH] = useState(0)

  // When a scoped portal host is provided (e.g. the theme preview), mount into it
  // and switch from viewport-relative `fixed` to host-relative `absolute` so the
  // window stays confined to that bounded host. Drag/resize is disabled in this
  // mode (the pixel-mode math is viewport-based and would be wrong inside a host).
  const { host, scoped } = usePortalHost()
  const posCls = scoped ? 'absolute' : 'fixed'

  const isDragging = useRef(false)
  const dragOrigin = useRef({ mx: 0, my: 0, wx: 0, wy: 0 })
  // Tracks whether the element is already in pixel-position mode
  const inPxMode   = useRef(false)

  // Resize state
  const isResizing  = useRef(false)
  const resizeEdge  = useRef('')
  const resizeOrigin = useRef({ mx: 0, my: 0, wx: 0, wy: 0, ww: 0, wh: 0 })

  const bringToFront = useCallback(() => {
    setZIndex(useWindowZStore.getState().next())
  }, [])

  // Passe en mode pixel (left/top px, transform: none)
  // Appelé une seule fois, au premier drag, pour "détacher" du centrage CSS
  const switchToPixelMode = useCallback(() => {
    const el = windowRef.current
    if (!el || inPxMode.current) return
    const rect = el.getBoundingClientRect()
    el.style.transform = 'none'
    el.style.left      = `${rect.left}px`
    el.style.top       = `${rect.top}px`
    inPxMode.current   = true
  }, [])

  // ── Drag ───────────────────────────────────────────────────────────────────

  const onTitleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scoped) return
    if ((e.target as HTMLElement).closest('button,a,input,select,textarea')) return
    const el = windowRef.current
    if (!el) return

    bringToFront()
    switchToPixelMode()

    const rect = el.getBoundingClientRect()
    isDragging.current  = true
    dragOrigin.current  = { mx: e.clientX, my: e.clientY, wx: rect.left, wy: rect.top }
    e.preventDefault()
  }, [bringToFront, switchToPixelMode, scoped])

  // ── Resize ─────────────────────────────────────────────────────────────────

  const onResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (scoped) return
    const el = windowRef.current
    if (!el) return

    bringToFront()
    switchToPixelMode()

    const rect = el.getBoundingClientRect()
    isResizing.current  = true
    resizeEdge.current  = e.currentTarget.dataset.edge ?? ''
    resizeOrigin.current = {
      mx: e.clientX, my: e.clientY,
      wx: rect.left, wy: rect.top,
      ww: rect.width, wh: rect.height,
    }
    e.preventDefault()
    e.stopPropagation()
  }, [bringToFront, switchToPixelMode, scoped])

  // ── Global mouse listeners ─────────────────────────────────────────────────

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = windowRef.current
      if (!el) return

      if (isDragging.current) {
        const { mx, my, wx, wy } = dragOrigin.current
        const nx = wx + e.clientX - mx
        const ny = wy + e.clientY - my
        // Clamp : garder au moins 100px de barre de titre accessible
        const maxX = window.innerWidth  - 100
        const maxY = window.innerHeight - 40
        el.style.left = `${Math.max(-el.offsetWidth + 100, Math.min(maxX, nx))}px`
        el.style.top  = `${Math.max(0, Math.min(maxY, ny))}px`
        return
      }

      if (isResizing.current) {
        const { mx, my, wx, wy, ww, wh } = resizeOrigin.current
        const dx = e.clientX - mx
        const dy = e.clientY - my
        const edge = resizeEdge.current

        let newW = ww, newH = wh, newX = wx, newY = wy

        if (edge.includes('e')) newW = Math.max(minWidth,  ww + dx)
        if (edge.includes('s')) newH = Math.max(minHeight, wh + dy)
        if (edge.includes('w')) { newW = Math.max(minWidth,  ww - dx); newX = wx + (ww - newW) }
        if (edge.includes('n')) { newH = Math.max(minHeight, wh - dy); newY = wy + (wh - newH) }

        el.style.width  = `${newW}px`
        el.style.height = `${newH}px`
        el.style.left   = `${newX}px`
        el.style.top    = `${newY}px`
      }
    }

    const onUp = () => {
      isDragging.current  = false
      isResizing.current  = false
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [minWidth, minHeight])

  // ── Echap ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // In the detached OS window, Escape closes the window, not just the component.
      const standalone = popout && !scoped
        && window.location.pathname + window.location.search === popout.route
      if (standalone) { try { window.close() } catch { /* best-effort */ } }
      onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose, popout, scoped])

  // ── Hauteur stable des fenêtres à onglets ──────────────────────────────────
  // Quand la fenêtre contient des onglets (`[role="tablist"]`, posé par le composant
  // `Tabs` — ou `[data-fw-tabs]` pour un bandeau d'onglets maison) ET que sa hauteur
  // est libre (pilotée par le contenu), on mémorise la hauteur MAXIMALE observée et
  // on l'impose en `minHeight` : changer d'onglet ne fait plus « sauter » la fenêtre,
  // elle reste calée sur l'onglet le plus haut. Les fenêtres SANS onglets continuent
  // de suivre naturellement leur contenu (aucune régression).
  useEffect(() => {
    const el = windowRef.current
    // Hauteur fixe (`defaultHeight`) ou hôte scopé → dimensionnement déjà stable.
    if (!el || scoped || defaultHeight !== undefined) return
    let max = 0
    const measure = () => {
      if (!el.querySelector('[role="tablist"],[data-fw-tabs]')) return
      const limit = window.innerHeight - 16          // ne jamais dépasser le viewport
      const h = Math.min(el.offsetHeight, limit)
      if (h > max + 0.5) { max = h; setLockedH(h) }   // croît vers l'onglet le plus haut
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [scoped, defaultHeight])

  // ── Pop-out desktop AUTOMATIQUE ────────────────────────────────────────────
  // On the desktop client, a popout-able floating window EXTRACTS itself into a
  // real OS window instead of rendering in-page (user requirement). The ↗ button
  // remains the manual path for callers that opt out (`popout.auto === false`).
  // Anti-loop guard: never auto-popout when already standing on the target route
  // (that IS the detached window rendering the component normally).
  const shouldAutoPopout = Boolean(
    popout
      && popout.auto !== false
      && typeof window !== 'undefined'
      && window.kubunoDesktop
      && window.location.pathname + window.location.search !== popout.route,
  )
  const autoFired = useRef(false)
  useEffect(() => {
    if (shouldAutoPopout && !autoFired.current && popout) {
      autoFired.current = true
      const label = popout.label ?? (typeof title === 'string' ? title : undefined)
      const opts = popout.width || popout.height
        ? { width: popout.width, height: popout.height }
        : undefined
      void window.kubunoDesktop?.openWindow(popout.route, label, opts)
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoPopout])

  // ── Render ─────────────────────────────────────────────────────────────────

  // Auto-popout: the OS window is opening — render nothing in-page.
  if (shouldAutoPopout) return null

  // Standalone/full-bleed: we ARE the detached OS window (on `popout.route`).
  // Drop the floating chrome (rounded corners, shadow, centering, size clamps)
  // and fill the whole viewport, so the OS window shows the app edge-to-edge
  // rather than a card floating in a blank page. The internal ✕ closes the OS
  // window (best-effort) in addition to unmounting.
  const isStandalone = Boolean(
    popout
      && typeof window !== 'undefined'
      && !scoped
      && window.location.pathname + window.location.search === popout.route,
  )
  // Phones get the same full-bleed treatment: a 560px-wide draggable card on a
  // 390px screen is clamped to a sliver, and dragging/resizing are meaningless
  // without a mouse. Scoped windows (bounded portal host, e.g. theme preview)
  // keep their card so they stay inside their box.
  const isMobile = useIsMobile()
  const fullBleed = isStandalone || (isMobile && !scoped)
  // Plain function (not a hook) — declared after the conditional return above.
  const closeWindow = () => {
    if (isStandalone && typeof window !== 'undefined') {
      try { window.close() } catch { /* best-effort */ }
    }
    onClose()
  }

  const resizeHandles = resizable ? (
    <>
      {/* Bords */}
      <div data-edge="n"  onMouseDown={onResizeMouseDown} className="absolute top-0    left-2  right-2  h-1   cursor-n-resize  z-10" />
      <div data-edge="s"  onMouseDown={onResizeMouseDown} className="absolute bottom-0 left-2  right-2  h-1   cursor-s-resize  z-10" />
      <div data-edge="w"  onMouseDown={onResizeMouseDown} className="absolute top-2   left-0  bottom-2  w-1   cursor-w-resize  z-10" />
      <div data-edge="e"  onMouseDown={onResizeMouseDown} className="absolute top-2   right-0 bottom-2  w-1   cursor-e-resize  z-10" />
      {/* Coins */}
      <div data-edge="nw" onMouseDown={onResizeMouseDown} className="absolute top-0    left-0  w-3 h-3  cursor-nw-resize z-20" />
      <div data-edge="ne" onMouseDown={onResizeMouseDown} className="absolute top-0    right-0 w-3 h-3  cursor-ne-resize z-20" />
      <div data-edge="sw" onMouseDown={onResizeMouseDown} className="absolute bottom-0 left-0  w-3 h-3  cursor-sw-resize z-20" />
      <div data-edge="se" onMouseDown={onResizeMouseDown} className="absolute bottom-0 right-0 w-3 h-3  cursor-se-resize z-20" />
    </>
  ) : null

  const content = (
    <>
      {backdrop && !isStandalone && (
        <div
          className={`${posCls} inset-0 ${scoped ? 'bg-black/15' : 'bg-black/30'} backdrop-blur-[1px] no-print`}
          style={{ zIndex: zIndex - 1 }}
          onClick={onClose}
        />
      )}

      <div
        ref={windowRef}
        role="dialog"
        aria-modal={backdrop && !isStandalone}
        className={`${posCls} bg-white flex flex-col overflow-hidden no-print ${className} ${
          fullBleed ? 'inset-0' : 'rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)]'
        }`}
        style={fullBleed ? {
          // Full-bleed: fill the OS window edge-to-edge, no chrome, no clamps.
          width:  '100vw',
          height: '100dvh',
          left:   0,
          top:    0,
          zIndex,
        } : {
          width:     defaultWidth,
          height:    defaultHeight,
          // Clamp to the host: a `minWidth` wider than the host (mobile) would
          // otherwise overflow (min-width wins over max-width in CSS). The host
          // is the viewport (`vw/vh`) or, when scoped, the bounded portal host.
          minWidth:  scoped ? `min(${minWidth}px, calc(100% - 16px))` : `min(${minWidth}px, calc(100vw - 16px))`,
          // Fenêtre à onglets : hauteur verrouillée sur l'onglet le plus haut (lockedH).
          minHeight: lockedH ? `${lockedH}px`
            : scoped ? `min(${minHeight}px, calc(100% - 16px))` : `min(${minHeight}px, calc(100vh - 16px))`,
          maxWidth:  scoped ? 'calc(100% - 16px)' : 'calc(100vw - 16px)',
          maxHeight: scoped ? 'calc(100% - 16px)' : 'calc(100vh - 16px)',
          zIndex,
          // Position CSS initiale : centré. Remplacée par left/top px au premier drag.
          left:      '50%',
          top:       '33%',
          transform: 'translate(-50%, -33%)',
        }}
        onMouseDown={fullBleed ? undefined : bringToFront}
      >
        {!fullBleed && resizeHandles}

        {/* Barre de titre (toolbar simple en mode plein cadre : pas de drag) */}
        <div
          className={`flex items-center gap-2.5 px-4 py-3 border-b border-border
                     flex-shrink-0 select-none ${fullBleed ? '' : 'cursor-move'}`}
          onMouseDown={fullBleed ? undefined : onTitleMouseDown}
        >
          {icon && (
            <div className="flex-shrink-0 text-text-secondary">{icon}</div>
          )}
          <div className="flex-1 min-w-0 text-sm font-medium text-text-primary truncate">
            {title}
          </div>
          {titleActions && (
            <div
              className="flex items-center gap-1 flex-shrink-0"
              onMouseDown={e => e.stopPropagation()}
            >
              {titleActions}
            </div>
          )}
          {popout && typeof window !== 'undefined' && window.kubunoDesktop
            // Already standing on the target route (popped-out window) → no button.
            && window.location.pathname + window.location.search !== popout.route && (
            <button
              onClick={() => {
                const label = popout.label ?? (typeof title === 'string' ? title : undefined)
                const opts = popout.width || popout.height
                  ? { width: popout.width, height: popout.height }
                  : undefined
                void window.kubunoDesktop?.openWindow(popout.route, label, opts)
                onClose()
              }}
              onMouseDown={e => e.stopPropagation()}
              title="Détacher dans une fenêtre"
              className="flex-shrink-0 p-1.5 rounded-lg text-text-tertiary
                         hover:text-text-primary hover:bg-surface-2 transition-colors"
            >
              <SquareArrowOutUpRight size={14} />
            </button>
          )}
          <button
            onClick={closeWindow}
            onMouseDown={e => e.stopPropagation()}
            title="Fermer (Échap)"
            className="flex-shrink-0 p-1.5 -mr-1 rounded-lg text-text-tertiary
                       hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    </>
  )

  return createPortal(content, host ?? document.body)
}
