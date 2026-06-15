import { useCallback, useEffect, useRef, useState } from 'react'
import type React from 'react'

export interface MarqueeStyle {
  position: 'fixed'
  left: number
  top: number
  width: number
  height: number
}

function getIntersecting(
  container: HTMLElement | null,
  x1: number, y1: number,
  x2: number, y2: number,
): Set<string> {
  const ml = Math.min(x1, x2)
  const mt = Math.min(y1, y2)
  const mr = Math.max(x1, x2)
  const mb = Math.max(y1, y2)
  const elements = (container ?? document).querySelectorAll('[data-selectable-id]')
  const ids = new Set<string>()
  elements.forEach(el => {
    const r = (el as HTMLElement).getBoundingClientRect()
    if (r.right >= ml && r.left <= mr && r.bottom >= mt && r.top <= mb) {
      const id = (el as HTMLElement).dataset.selectableId
      if (id) ids.add(id)
    }
  })
  return ids
}

// Zone (px) près des bords haut/bas du conteneur qui déclenche le défilement
// automatique pendant un glissement de sélection, et vitesse max (px/frame).
const EDGE_ZONE  = 56
const MAX_SPEED  = 22

export function useMarqueeSelection(
  onSelectIds: (ids: Set<string>, additive: boolean) => void,
) {
  const containerRef     = useRef<HTMLDivElement>(null)
  // Ancre de départ exprimée en coordonnées de CONTENU (relatives au conteneur,
  // décalage de défilement inclus) : ainsi les éléments qui défilent hors écran
  // restent dans le rectangle de sélection.
  const anchorRef        = useRef<{ x: number; y: number } | null>(null)
  const downClientRef    = useRef<{ x: number; y: number } | null>(null)
  const pointerRef       = useRef<{ x: number; y: number } | null>(null)
  const additiveRef      = useRef(false)
  const draggedRef       = useRef(false)
  const rafRef           = useRef<number | null>(null)
  const [marqueeStyle,   setMarqueeStyle]   = useState<MarqueeStyle | null>(null)
  const [preSelectedIds, setPreSelectedIds] = useState<Set<string>>(new Set())

  // Position client actuelle du point d'ancrage (recalculée selon le défilement).
  const startClient = useCallback((): { x: number; y: number } | null => {
    const el = containerRef.current
    const a  = anchorRef.current
    if (!el || !a) return null
    const r = el.getBoundingClientRect()
    return { x: r.left + a.x - el.scrollLeft, y: r.top + a.y - el.scrollTop }
  }, [])

  // Met à jour le rectangle visuel + la pré-sélection à partir de l'ancre et du
  // dernier point du pointeur (tous deux en coordonnées client).
  const recompute = useCallback(() => {
    const s = startClient()
    const p = pointerRef.current
    if (!s || !p) return
    setMarqueeStyle({
      position: 'fixed',
      left:   Math.min(s.x, p.x),
      top:    Math.min(s.y, p.y),
      width:  Math.abs(p.x - s.x),
      height: Math.abs(p.y - s.y),
    })
    setPreSelectedIds(getIntersecting(containerRef.current, s.x, s.y, p.x, p.y))
  }, [startClient])

  const stopAutoScroll = useCallback(() => {
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
  }, [])

  // Boucle de défilement automatique tant que le pointeur reste dans une zone de bord.
  const tickAutoScroll = useCallback(() => {
    const el = containerRef.current
    const p  = pointerRef.current
    if (!el || !p || !anchorRef.current) { rafRef.current = null; return }
    const r = el.getBoundingClientRect()
    let speed = 0
    if (p.y < r.top + EDGE_ZONE) {
      const depth = (r.top + EDGE_ZONE - p.y) / EDGE_ZONE
      speed = -Math.min(MAX_SPEED, MAX_SPEED * depth)
    } else if (p.y > r.bottom - EDGE_ZONE) {
      const depth = (p.y - (r.bottom - EDGE_ZONE)) / EDGE_ZONE
      speed = Math.min(MAX_SPEED, MAX_SPEED * depth)
    }
    if (speed !== 0) {
      const before = el.scrollTop
      el.scrollTop = before + speed
      if (el.scrollTop !== before) recompute()  // le contenu a bougé → réévaluer
      rafRef.current = requestAnimationFrame(tickAutoScroll)
    } else {
      rafRef.current = null
    }
  }, [recompute])

  const maybeStartAutoScroll = useCallback(() => {
    const el = containerRef.current
    const p  = pointerRef.current
    if (!el || !p) return
    const r = el.getBoundingClientRect()
    const inEdge = p.y < r.top + EDGE_ZONE || p.y > r.bottom - EDGE_ZONE
    if (inEdge && rafRef.current == null) {
      rafRef.current = requestAnimationFrame(tickAutoScroll)
    }
  }, [tickAutoScroll])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest(
      '[data-selectable-id], button, a, input, select, label, [role="button"], [role="menuitem"]'
    )) return
    // NB : NE PAS appeler e.preventDefault() ici. preventDefault sur un pointerdown
    // supprime l'événement `mousedown` de compatibilité, ce qui empêchait les
    // handlers « clic en dehors » (menus contextuels, dropdowns) de se déclencher
    // lorsqu'on cliquait sur le fond de la grille. La sélection de texte pendant
    // un glissement est neutralisée via `user-select: none` une fois le marquee actif.
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
    additiveRef.current = e.ctrlKey || e.metaKey || e.shiftKey
    draggedRef.current  = false
    const el = containerRef.current
    const r  = el?.getBoundingClientRect()
    // Ancre en coordonnées de contenu (défilement inclus).
    anchorRef.current  = el && r
      ? { x: e.clientX - r.left + el.scrollLeft, y: e.clientY - r.top + el.scrollTop }
      : { x: e.clientX, y: e.clientY }
    downClientRef.current = { x: e.clientX, y: e.clientY }
    pointerRef.current    = { x: e.clientX, y: e.clientY }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!anchorRef.current) return
    pointerRef.current = { x: e.clientX, y: e.clientY }
    // Empêcher la sélection de texte uniquement pendant un glissement réel
    document.body.style.userSelect = 'none'
    draggedRef.current = true
    recompute()
    maybeStartAutoScroll()
  }, [recompute, maybeStartAutoScroll])

  const finish = useCallback((cancelled: boolean) => {
    stopAutoScroll()
    const anchorExists = !!anchorRef.current
    const additive  = additiveRef.current
    const down      = downClientRef.current
    const pointer   = pointerRef.current
    const s         = startClient()
    anchorRef.current  = null
    downClientRef.current = null
    pointerRef.current = null
    setMarqueeStyle(null)
    setPreSelectedIds(new Set())
    document.body.style.userSelect = ''
    if (cancelled || !anchorExists) return

    const dx = down && pointer ? Math.abs(pointer.x - down.x) : 0
    const dy = down && pointer ? Math.abs(pointer.y - down.y) : 0
    if (!draggedRef.current || (dx < 5 && dy < 5)) {
      // Clic sur le fond : désélectionner (sans modificateur)
      if (!additive) onSelectIds(new Set(), false)
      return
    }
    if (s && pointer) {
      onSelectIds(getIntersecting(containerRef.current, s.x, s.y, pointer.x, pointer.y), additive)
    }
  }, [onSelectIds, startClient, stopAutoScroll])

  const onPointerUp     = useCallback(() => finish(false), [finish])
  const onPointerCancel = useCallback(() => finish(true),  [finish])

  useEffect(() => () => stopAutoScroll(), [stopAutoScroll])

  return {
    containerRef, marqueeStyle, preSelectedIds,
    onPointerDown, onPointerMove, onPointerUp, onPointerCancel,
  }
}
