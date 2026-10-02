/**
 * The layout containers of `.kbview` web views (VIEWS-SPEC §5, lot WV-5a): `UserControl` (the root of a
 * `.kbcontrol`), `Panel` (dock bands, or absolute placement with `Layout="Absolute"`), `Stack` (flow along a
 * direction) and `ScrollArea` (one scrolling child).
 *
 * They live in the runtime, not in `@ui`, because a dock container reads its children's attached layout
 * values (`Dock`, `X`, `Y`…) from the plan: the renderer gives every element of `@kubuno/views` its view
 * (`__view`) and element id (`__id`).
 *
 * Web rendering of a clickable container: `AccessibleRole="PushButton"` renders a native `<button>` and a
 * web-only `Href` renders a link (`<a href>`); either keeps the keyboard and screen-reader behaviour of the
 * native element. A plain left click on a link stays in the app (the view's `OnClick` decides where to go);
 * a modified or middle click opens the address like any link.
 */
import {
  Children,
  createElement,
  forwardRef,
  isValidElement,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'

import type { PlanNode } from './plan'
import type { Internals } from './view'

/** The theme surfaces a container may paint (VIEWS-SPEC §4.1: tokens only). */
export type Surface = 'None' | 'Layer' | 'Card' | 'Raised' | 'Well'

const SURFACES: Readonly<Record<string, string>> = {
  Layer: 'var(--color-surface-1)',
  Card: 'var(--color-surface-0)',
  Raised: 'var(--color-surface-0)',
  Well: 'var(--color-surface-2)',
}

/** What every container receives besides its own properties. */
interface ContainerBase {
  children?: ReactNode
  className?: string
  style?: CSSProperties
  /** `Enabled="false"`: a native button is disabled, another container made inert. */
  disabled?: boolean
  tabIndex?: number
  'aria-label'?: string
  role?: string
  href?: string
  onClick?: (e: ReactMouseEvent<HTMLElement>) => void
  surface?: Surface
  /** @internal — given by the renderer to every element of `@kubuno/views`. */
  __view?: Internals
  /** @internal */
  __id?: string
}


/**
 * The element a container renders: a `<button>` for `AccessibleRole="PushButton"`, an `<a>` with `Href`,
 * else a `<div>`. The `role` given by the runtime is dropped when the native element already has it.
 */
function box(p: ContainerBase, layout: CSSProperties, extra: Record<string, unknown>, ref: Ref<HTMLElement>): ReactElement {
  const { className, style, disabled, tabIndex, role, href, onClick, surface } = p
  const isButton = role === 'button' && !href
  const tag = isButton ? 'button' : href ? 'a' : 'div'
  const bg = surface && surface !== 'None' ? { backgroundColor: SURFACES[surface] } : undefined
  const props: Record<string, unknown> = {
    ref,
    className,
    style: { ...layout, ...bg, ...style },
    tabIndex,
    'aria-label': p['aria-label'],
    ...extra,
  }
  if (isButton) {
    props.type = 'button'
    props.disabled = disabled || undefined
  } else {
    if (role && !(href && role === 'link')) props.role = role
    if (disabled) {
      props.inert = true
      props['aria-disabled'] = 'true'
    }
  }
  if (href) {
    props.href = href
    props.onClick = (e: ReactMouseEvent<HTMLElement>) => {
      // A plain click stays in the app: the view's handler navigates (SPA routing).
      if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) e.preventDefault()
      onClick?.(e)
    }
  } else if (onClick) {
    props.onClick = onClick
  }
  return createElement(tag, props, p.children)
}

// ── Reading the children's attached layout values from the plan ──

/** The plan node of a rendered child (`KbNode` elements carry it), if any. */
function childNode(child: ReactNode): PlanNode | undefined {
  if (!isValidElement(child)) return undefined
  const node = (child.props as { node?: PlanNode }).node
  return node && typeof node === 'object' && 'el' in node ? node : undefined
}

/** A child's current value of a layout property (literal, or bound, through the view). */
function layoutValue(view: Internals | undefined, node: PlanNode | undefined, name: string): unknown {
  if (!node) return undefined
  const p = node.props?.find((x) => x.n === name)
  if (!p) return undefined
  if (p.v !== undefined) return p.v
  return view?.read?.(node.id, name)
}

// ── Panel / UserControl: dock bands ──

export type DockValue = 'None' | 'Top' | 'Bottom' | 'Left' | 'Right' | 'Fill'

/** Where a docked child goes in the dock grid: `[rowStart, rowEnd, colStart, colEnd]` (1-based lines). */
export interface DockPlacement {
  readonly row: readonly [number, number]
  readonly col: readonly [number, number]
}

export interface DockGrid {
  /** `grid-template-rows` / `-columns`. */
  readonly rows: string
  readonly columns: string
  readonly placements: readonly DockPlacement[]
}

/**
 * The CSS grid of a dock layout (WinForms semantics: each docked child, in document order, takes a band
 * along one edge of the room the previous ones left; `Fill` and undocked children share the rest). Columns
 * follow the inline direction, so `Left` is the inline start: a view mirrors correctly in `ar`/`he`.
 */
export function dockGrid(docks: readonly DockValue[]): DockGrid {
  const tops = docks.filter((d) => d === 'Top').length
  const bottoms = docks.filter((d) => d === 'Bottom').length
  const lefts = docks.filter((d) => d === 'Left').length
  const rights = docks.filter((d) => d === 'Right').length
  // Lines: rows 1..tops+1 for the top bands, then the centre row, then the bottom bands.
  let top = 1
  let bottom = tops + 2 + bottoms // the last row line
  let left = 1
  let right = lefts + 2 + rights
  const placements: DockPlacement[] = []
  for (const d of docks) {
    switch (d) {
      case 'Top': placements.push({ row: [top, top + 1], col: [left, right] }); top++; break
      case 'Bottom': placements.push({ row: [bottom - 1, bottom], col: [left, right] }); bottom--; break
      case 'Left': placements.push({ row: [top, bottom], col: [left, left + 1] }); left++; break
      case 'Right': placements.push({ row: [top, bottom], col: [right - 1, right] }); right--; break
      default: placements.push({ row: [-1, -1], col: [-1, -1] }); break // Fill / None: the centre, below
    }
  }
  const centre: DockPlacement = { row: [tops + 1, tops + 2], col: [lefts + 1, lefts + 2] }
  const resolved = placements.map((p) => (p.row[0] === -1 ? centre : p))
  const rows = [...Array<string>(tops).fill('auto'), 'minmax(0, 1fr)', ...Array<string>(bottoms).fill('auto')].join(' ')
  const columns = [...Array<string>(lefts).fill('auto'), 'minmax(0, 1fr)', ...Array<string>(rights).fill('auto')].join(' ')
  return { rows, columns, placements: resolved }
}

interface PanelProps extends ContainerBase {
  /** `Dock` (default) or `Absolute`. */
  layout?: 'Dock' | 'Absolute'
}

function renderDock(p: PanelProps, ref: Ref<HTMLElement>, root: CSSProperties = {}): ReactElement {
  const kids = Children.toArray(p.children)
  if (p.layout === 'Absolute') {
    const placed = kids.map((child, k) => {
      const node = childNode(child)
      const n = (name: string): number | undefined => {
        const v = Number(layoutValue(p.__view, node, name))
        return Number.isFinite(v) ? v : undefined
      }
      const style: CSSProperties = { position: 'absolute', insetInlineStart: n('X') ?? 0, top: n('Y') ?? 0 }
      return createElement('div', { key: node?.id ?? k, style }, child)
    })
    return box({ ...p, children: placed }, { position: 'relative', ...root }, {}, ref)
  }
  const docks = kids.map((child) => {
    const v = String(layoutValue(p.__view, childNode(child), 'Dock') ?? 'None')
    return (['Top', 'Bottom', 'Left', 'Right', 'Fill'].includes(v) ? v : 'None') as DockValue
  })
  // Nothing docked: a plain block, children in flow.
  if (docks.every((d) => d === 'None')) return box(p, root, {}, ref)
  const grid = dockGrid(docks)
  const placed = kids.map((child, k) => {
    const at = grid.placements[k]
    const node = childNode(child)
    const style: CSSProperties = {
      gridRow: `${at.row[0]} / ${at.row[1]}`,
      gridColumn: `${at.col[0]} / ${at.col[1]}`,
      display: 'grid',
      minHeight: 0,
      minWidth: 0,
    }
    if (docks[k] === 'Fill' || docks[k] === 'None') style.gridTemplateRows = 'minmax(0, 1fr)'
    return createElement('div', { key: node?.id ?? k, style, 'data-kb-dock': docks[k] }, child)
  })
  const layout: CSSProperties = { display: 'grid', gridTemplateRows: grid.rows, gridTemplateColumns: grid.columns, minHeight: 0, ...root }
  return box({ ...p, children: placed }, layout, {}, ref)
}

/** `<Panel>`: children docked as bands (`Dock`), or placed by `X`/`Y` in `Layout="Absolute"`. */
export const Panel = forwardRef<HTMLElement, PanelProps>(function Panel(props, ref) {
  return renderDock(props, ref)
})

/**
 * `<UserControl>`: the root of a `.kbcontrol` — a dock container that fills the room its host gives it
 * (it shrinks with a capped host, so a `Dock="Fill"` child can scroll).
 */
export const UserControl = forwardRef<HTMLElement, PanelProps>(function UserControl(props, ref) {
  return renderDock(props, ref, { minHeight: 0, flex: '1 1 auto' })
})

// ── Stack: flow along a direction ──

const DIRECTIONS: Readonly<Record<string, CSSProperties['flexDirection']>> = {
  TopDown: 'column', LeftToRight: 'row', RightToLeft: 'row-reverse', BottomUp: 'column-reverse',
}
const CROSS: Readonly<Record<string, CSSProperties['alignItems']>> = {
  Stretch: 'stretch', Start: 'flex-start', Center: 'center', End: 'flex-end',
}
const JUSTIFY: Readonly<Record<string, CSSProperties['justifyContent']>> = {
  Start: 'flex-start', Center: 'center', End: 'flex-end', SpaceBetween: 'space-between',
}

interface StackProps extends ContainerBase {
  direction?: string
  gap?: number
  crossAlign?: string
  justify?: string
  wrap?: boolean
}

/** `<Stack>`: children along `Direction`, `Gap` px apart; a child with `Stack.Fill="true"` takes the rest. */
export const Stack = forwardRef<HTMLElement, StackProps>(function Stack(p, ref) {
  const layout: CSSProperties = {
    display: 'flex',
    flexDirection: DIRECTIONS[p.direction ?? 'TopDown'] ?? 'column',
    alignItems: CROSS[p.crossAlign ?? 'Stretch'] ?? 'stretch',
  }
  const gap = p.gap ?? 8
  if (gap) layout.gap = `${gap}px`
  if (p.justify && p.justify !== 'Start') layout.justifyContent = JUSTIFY[p.justify]
  if (p.wrap) layout.flexWrap = 'wrap'
  return box(p, layout, {}, ref)
})

// ── ScrollArea: one scrolling child ──

interface ScrollAreaProps extends ContainerBase {
  /** `Corner`: radius of the scrolling viewport, px. */
  corner?: number
  /** Web: `scrollbar-gutter`. */
  gutter?: 'Auto' | 'Stable' | 'StableBothEdges'
  /** Web: which axes scroll. */
  scrollBars?: 'Vertical' | 'Horizontal' | 'Both'
}

const GUTTERS: Readonly<Record<string, CSSProperties['scrollbarGutter']>> = {
  Stable: 'stable', StableBothEdges: 'stable both-edges',
}

/** `<ScrollArea>`: its single child scrolls inside it (it shrinks with its container: `min-height: 0`). */
export const ScrollArea = forwardRef<HTMLElement, ScrollAreaProps>(function ScrollArea(p, ref) {
  const axes = p.scrollBars ?? 'Vertical'
  // Only the axes asked for are set (`overflow-y: auto` alone, as hand-written lists do).
  const layout: CSSProperties =
    axes === 'Vertical' ? { overflowY: 'auto' } : axes === 'Horizontal' ? { overflowX: 'auto' } : { overflow: 'auto' }
  layout.minHeight = 0
  if (p.corner) layout.borderRadius = `${p.corner}px`
  const gutter = p.gutter ? GUTTERS[p.gutter] : undefined
  if (gutter) layout.scrollbarGutter = gutter
  return box(p, layout, { 'data-kb-scroll': '' }, ref)
})
