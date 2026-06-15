import { useRef, useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useWindowZStore } from './windowZStore'

interface FloatingWindowProps {
  // Contenu
  title:         string | React.ReactNode
  icon?:         React.ReactNode
  children:      React.ReactNode
  titleActions?: React.ReactNode   // boutons à droite du titre (avant le ×)

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
    if ((e.target as HTMLElement).closest('button,a,input,select,textarea')) return
    const el = windowRef.current
    if (!el) return

    bringToFront()
    switchToPixelMode()

    const rect = el.getBoundingClientRect()
    isDragging.current  = true
    dragOrigin.current  = { mx: e.clientX, my: e.clientY, wx: rect.left, wy: rect.top }
    e.preventDefault()
  }, [bringToFront, switchToPixelMode])

  // ── Resize ─────────────────────────────────────────────────────────────────

  const onResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
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
  }, [bringToFront, switchToPixelMode])

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
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  // ── Render ─────────────────────────────────────────────────────────────────

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
      {backdrop && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[1px]"
          style={{ zIndex: zIndex - 1 }}
          onClick={onClose}
        />
      )}

      <div
        ref={windowRef}
        role="dialog"
        aria-modal={backdrop}
        className={`fixed bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)]
                    flex flex-col overflow-hidden ${className}`}
        style={{
          width:     defaultWidth,
          height:    defaultHeight,
          minWidth,
          minHeight,
          maxWidth:  'calc(100vw - 16px)',
          maxHeight: 'calc(100vh - 16px)',
          zIndex,
          // Position CSS initiale : centré. Remplacée par left/top px au premier drag.
          left:      '50%',
          top:       '33%',
          transform: 'translate(-50%, -33%)',
        }}
        onMouseDown={bringToFront}
      >
        {resizeHandles}

        {/* Barre de titre */}
        <div
          className="flex items-center gap-2.5 px-4 py-3 border-b border-border
                     flex-shrink-0 cursor-move select-none"
          onMouseDown={onTitleMouseDown}
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
          <button
            onClick={onClose}
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

  return createPortal(content, document.body)
}
