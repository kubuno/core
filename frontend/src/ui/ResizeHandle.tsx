import { useState, useEffect, type MouseEvent as ReactMouseEvent } from 'react'
import { GripVertical } from 'lucide-react'

// Poignée de redimensionnement horizontal réutilisable. Visuelle pure : la largeur
// est contrôlée par le parent. La poignée est positionnée en ABSOLU sur la jointure
// (le parent doit être `relative`) avec un z élevé → jamais rognée ni recouverte par
// les panneaux voisins (qui peuvent être `overflow-hidden`).

export function ResizeHandle({
  position,
  onResize,
  min = 160,
  max = 560,
  onReset,
  title,
}: {
  /** Position (px depuis la gauche) de la jointure = largeur du panneau de gauche. */
  position: number
  onResize: (width: number) => void
  min?: number
  max?: number
  /** Double-clic → réinitialise (optionnel). */
  onReset?: () => void
  title?: string
}) {
  const startResize = (e: ReactMouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = position
    let dragging = true
    const onMove = (ev: globalThis.MouseEvent) => {
      if (!dragging) return
      onResize(Math.max(min, Math.min(max, startW + (ev.clientX - startX))))
    }
    const onUp = () => {
      dragging = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ew-resize'
  }

  return (
    <div
      onMouseDown={startResize}
      onDoubleClick={onReset}
      title={title}
      style={{ left: position }}
      className="absolute top-0 bottom-0 z-20 w-3 -translate-x-1/2 cursor-ew-resize group"
    >
      {/* ligne verticale visible (centrée dans la zone de saisie) */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border group-hover:bg-primary/40 transition-colors" />
      {/* poignée (grip) indiquant que c'est redimensionnable */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center
                      h-9 w-3.5 rounded-full bg-surface-0 border border-border text-text-tertiary shadow-sm
                      opacity-80 group-hover:opacity-100 group-hover:bg-primary-light group-hover:text-primary
                      group-hover:border-primary/40 transition">
        <GripVertical size={13} />
      </div>
    </div>
  )
}

// Largeur redimensionnable mémorisée (localStorage), bornée [min, max].
export function useResizableWidth(key: string, def: number, min = 160, max = 560): [number, (w: number) => void] {
  const [w, setW] = useState(() => {
    const saved = Number(localStorage.getItem(key))
    return saved >= min && saved <= max ? saved : def
  })
  useEffect(() => { try { localStorage.setItem(key, String(w)) } catch { /* ignore */ } }, [key, w])
  return [w, setW]
}
