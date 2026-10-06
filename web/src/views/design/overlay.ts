/**
 * Draws the adorners of the design surface into its overlay layer (vskubuno docs/DESIGNER.md §9 "Adorners",
 * WEB-VIEWS.md §4.3): faint outlines of containers that paint nothing, the hover stroke, the dashed outline of
 * the primary selection's parent, a frame 3 px outside each selected element with its 8 grab handles (filled when
 * the handle resizes the element), and the drag feedback (insertion marker, dock band, move / resize ghost with its
 * size). Rectangles are page (viewport) px; the layer is positioned at `origin`.
 */
import { handleRects, selectionFrame, type Handle, type Rect } from './geometry'

export interface SelectedAdorner {
  readonly bounds: Rect
  readonly primary: boolean
  readonly resizable: ReadonlySet<Handle>
}

export interface AdornerSpec {
  readonly outlines: readonly Rect[]
  readonly hover: Rect | null
  readonly parent: Rect | null
  readonly selected: readonly SelectedAdorner[]
  readonly marker?: { readonly rect: Rect; readonly kind: 'line' | 'box' | 'ghost'; readonly valid: boolean } | null
  readonly band?: Rect | null
  readonly ghost?: Rect | null
  readonly tip?: { readonly x: number; readonly y: number; readonly text: string } | null
}

function box(layer: HTMLElement, origin: { left: number; top: number }, r: Rect, cls: string, attrs: Record<string, string> = {}): HTMLElement {
  const el = layer.ownerDocument.createElement('div')
  el.className = `kbd-ad ${cls}`
  el.style.left = `${r.left - origin.left}px`
  el.style.top = `${r.top - origin.top}px`
  el.style.width = `${Math.max(0, r.right - r.left)}px`
  el.style.height = `${Math.max(0, r.bottom - r.top)}px`
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  layer.appendChild(el)
  return el
}

/** Replaces the layer's adorners with the ones `spec` describes. */
export function drawAdorners(layer: HTMLElement, origin: { left: number; top: number }, spec: AdornerSpec): void {
  layer.replaceChildren()
  for (const r of spec.outlines) box(layer, origin, r, 'kbd-outline')
  if (spec.parent) box(layer, origin, spec.parent, 'kbd-parent')
  if (spec.hover) box(layer, origin, spec.hover, 'kbd-hover')
  if (spec.band) box(layer, origin, spec.band, 'kbd-band')
  for (const s of spec.selected) {
    const frame = selectionFrame(s.bounds)
    box(layer, origin, frame, 'kbd-sel', { 'data-primary': String(s.primary) })
    for (const { handle, rect } of handleRects(frame)) {
      box(layer, origin, rect, 'kbd-handle', { 'data-handle': handle, 'data-resizable': String(s.resizable.has(handle)) })
    }
  }
  if (spec.ghost) box(layer, origin, spec.ghost, 'kbd-ghost')
  if (spec.marker) {
    box(layer, origin, spec.marker.rect, 'kbd-marker', { 'data-kind': spec.marker.kind, 'data-valid': String(spec.marker.valid) })
  }
  if (spec.tip) {
    const el = layer.ownerDocument.createElement('div')
    el.className = 'kbd-size-tip'
    el.style.left = `${spec.tip.x - origin.left + 12}px`
    el.style.top = `${spec.tip.y - origin.top + 14}px`
    el.textContent = spec.tip.text
    layer.appendChild(el)
  }
}

/** The cursor of a grab handle. */
export function handleCursor(h: Handle): string {
  return h === 'n' || h === 's' ? 'ns-resize' : h === 'e' || h === 'w' ? 'ew-resize' : h === 'nw' || h === 'se' ? 'nwse-resize' : 'nesw-resize'
}
