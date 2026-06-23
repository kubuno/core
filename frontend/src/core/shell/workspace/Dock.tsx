// Core primitive: a draggable / dockable panel system shared by advanced editors
// (PaintSharp sub-editors, the App builder, …). Panels are tabs that can be
// re-docked left/right, merged into a tab group, split top/bottom, torn off as
// floating windows, resized, closed and reopened — with a single ghost rectangle
// showing the exact landing zone during a drag.
//
// The host supplies a panel registry { id → { label, render } } and a default
// arrangement; DockArea owns the layout state, persistence, drag logic and the
// viewport-with-docks row. Panel ids are plain strings (editor-defined).
//
// Generalised from `paintsharp/ui/Dock` so every module can reuse the same dock,
// exactly like WorkspaceShell was generalised from `paintsharp/ui/EditorShell`.
import { useEffect, useRef, useState, Fragment } from 'react'
import type { ReactNode, CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { X, Plus, GripVertical, GripHorizontal, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Maximize2, Minimize2, Square } from 'lucide-react'
import { MenuDropdown, type MenuItem, type MenuDropdownPos } from '@ui'

export type PanelId = string
export type DockSideKey = 'left' | 'right' | 'float'
export interface DockGroup {
  id: string; panels: PanelId[]; active: PanelId
  x?: number; y?: number   // float position
  h?: number               // stacked-group height weight (left/right columns)
  rolled?: boolean         // float rolled up to its header bar
  max?: boolean            // float maximized to the viewport
}
export interface DockLayout {
  left: DockGroup[]; right: DockGroup[]; float: DockGroup[]
  leftW?: number; rightW?: number     // column widths (resizable, persisted)
  closed?: PanelId[]                  // panels the user closed (re-openable)
}
export type DropTarget =
  | { type:'tabs';   side:DockSideKey; gid:string }
  | { type:'split';  side:'left'|'right'; gid:string; where:'top'|'bottom' }
  | { type:'newcol'; side:'left'|'right' }
  | { type:'float';  x:number; y:number }

type GuideRect = { left: number; top: number; width: number; height: number }
// Visual Studio "guide diamond" indicator: a compass over the hovered pane plus
// edge arrows. Dropping the dragged panel on a guide docks it in that zone.
type Guide = { id: string; cx: number; cy: number; dir: 'C'|'N'|'S'|'E'|'W'; tgt: DropTarget; rect: GuideRect }

export type DockPanel = { label: ReactNode; render: () => ReactNode }
export type DockController = {
  activate: (id: PanelId) => void
  reset: () => void
  open: (id: PanelId) => void
  close: (id: PanelId) => void
}
export type DockTheme = { panel:string; header:string; border:string; text:string; textDim:string; accent?:string }

const DEFAULT_THEME: DockTheme = { panel:'#f8f9fa', header:'#f1f3f4', border:'#dadce0', text:'#202124', textDim:'#5f6368', accent:'#1a73e8' }
const MIN_W = 190, MAX_W = 480, DEF_W = 256
const MIN_H = 60   // minimum height (px) of a stacked panel group when resizing

let _gid = 1
const newGid = () => 'g' + (_gid++)

function activatePanel(layout: DockLayout, id: PanelId): DockLayout {
  const upd = (arr: DockGroup[]) => arr.map(g => g.panels.includes(id) ? { ...g, active:id } : g)
  return { ...layout, left:upd(layout.left), right:upd(layout.right), float:upd(layout.float) }
}
function removePanel(layout: DockLayout, id: PanelId): DockLayout {
  const strip = (arr: DockGroup[]) => arr
    .map(g => g.panels.includes(id) ? { ...g, panels:g.panels.filter(p=>p!==id), active: g.active===id ? g.panels.filter(p=>p!==id)[0] : g.active } : g)
    .filter(g => g.panels.length > 0)
  return { ...layout, left:strip(layout.left), right:strip(layout.right), float:strip(layout.float) }
}
function applyDrop(layout: DockLayout, id: PanelId, tgt: DropTarget): DockLayout {
  const L = removePanel(layout, id)
  const mk = (panels: PanelId[]): DockGroup => ({ id:newGid(), panels, active:panels[0] })
  if (tgt.type === 'float') return { ...L, float:[...L.float, { ...mk([id]), x:tgt.x, y:tgt.y }] }
  if (tgt.type === 'newcol') return { ...L, [tgt.side]:[...L[tgt.side], mk([id])] }
  const arr = [...L[tgt.side]]
  const gi = arr.findIndex(g => g.id === tgt.gid)
  if (gi < 0) {
    const side = tgt.side === 'float' ? 'right' : tgt.side
    return { ...L, [side]: [...L[side], mk([id])] }
  }
  if (tgt.type === 'tabs') { arr[gi] = { ...arr[gi], panels:[...arr[gi].panels, id], active:id }; return { ...L, [tgt.side]:arr } }
  arr.splice(tgt.where === 'top' ? gi : gi+1, 0, mk([id]))
  return { ...L, [tgt.side]:arr }
}
// Close → park the panel in `closed` (re-openable). Open → re-dock it on the right.
function closePanel(layout: DockLayout, id: PanelId): DockLayout {
  const L = removePanel(layout, id)
  return { ...L, closed: [...(L.closed ?? []).filter(p => p !== id), id] }
}
function openPanel(layout: DockLayout, id: PanelId): DockLayout {
  const closed = (layout.closed ?? []).filter(p => p !== id)
  return { ...layout, closed, right: [...layout.right, { id:newGid(), panels:[id], active:id }] }
}

function buildDefault(arr: { left?: PanelId[][]; right?: PanelId[][]; float?: PanelId[][] }): DockLayout {
  const mk = (gs?: PanelId[][]) => (gs ?? []).map(panels => ({ id:newGid(), panels:[...panels], active:panels[0] }))
  return { left: mk(arr.left), right: mk(arr.right), float: mk(arr.float), leftW: DEF_W, rightW: DEF_W, closed: [] }
}

// Drop panels no longer in the registry; append registry panels missing from the
// layout (so newly-added panels appear) UNLESS the user explicitly closed them.
function reconcile(layout: DockLayout, known: Set<PanelId>): DockLayout {
  const sides: DockSideKey[] = ['left','right','float']
  const out: DockLayout = { left:[], right:[], float:[], leftW: layout.leftW ?? DEF_W, rightW: layout.rightW ?? DEF_W, closed: [] }
  const present = new Set<PanelId>()
  for (const side of sides) {
    out[side] = layout[side]
      .map(g => {
        const panels = g.panels.filter(p => known.has(p))
        panels.forEach(p => present.add(p))
        return { ...g, panels, active: panels.includes(g.active) ? g.active : panels[0] }
      })
      .filter(g => g.panels.length > 0)
  }
  out.closed = (layout.closed ?? []).filter(p => known.has(p))
  out.closed.forEach(p => present.add(p))
  for (const p of known) if (!present.has(p)) out.right.unshift({ id:newGid(), panels:[p], active:p })
  return out
}

export function DockArea({
  panels, storageKey, defaultArrangement, viewportBg = '#141414', hidden = false,
  theme = DEFAULT_THEME, moveTitle, children, className = 'flex flex-1 min-w-0', style, viewportRef, controllerRef,
}: {
  panels: Record<string, DockPanel>
  storageKey: string
  defaultArrangement: { left?: PanelId[][]; right?: PanelId[][]; float?: PanelId[][] }
  viewportBg?: string
  hidden?: boolean
  theme?: DockTheme
  moveTitle?: string
  children: ReactNode
  className?: string
  style?: CSSProperties
  viewportRef?: React.Ref<HTMLDivElement>
  controllerRef?: React.MutableRefObject<DockController | null>
}) {
  const known = new Set(Object.keys(panels))
  const [layout, setLayout] = useState<DockLayout>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(storageKey) || '')
      if (v?.left && v?.right && v?.float) return reconcile(v, known)
    } catch { /* ignore */ }
    return reconcile(buildDefault(defaultArrangement), known)
  })
  const [docking, setDocking] = useState(false)
  const [ghostRect, setGhostRect] = useState<{left:number;top:number;width:number;height:number}|null>(null)
  const [guides, setGuides] = useState<Guide[]>([])
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null)
  const [tabMenu, setTabMenu] = useState<{ pos: MenuDropdownPos; panel: PanelId } | null>(null)
  const [openMenu, setOpenMenu] = useState<MenuDropdownPos | null>(null)
  const dragPanelRef = useRef<PanelId|null>(null)
  const dragStartPt = useRef({x:0,y:0}); const dragMoved = useRef(false)
  const bodyAreaRef = useRef<HTMLDivElement>(null)
  const dragSize = useRef({ w:256, h:300 })
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(layout)) } catch { /* ignore */ } }, [layout, storageKey])

  const resetLayout = () => setLayout(reconcile(buildDefault(defaultArrangement), new Set(Object.keys(panels))))
  if (controllerRef) controllerRef.current = {
    activate: (id) => setLayout(prev => activatePanel(prev, id)),
    reset: resetLayout,
    open: (id) => setLayout(prev => openPanel(prev, id)),
    close: (id) => setLayout(prev => closePanel(prev, id)),
  }

  // ── Column resize (drag the inner edge) ──
  function startColResize(side: 'left'|'right', e: ReactPointerEvent) {
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX
    const startW = (side === 'left' ? layout.leftW : layout.rightW) ?? DEF_W
    const onMove = (ev: PointerEvent) => {
      const delta = ev.clientX - startX
      const w = Math.max(MIN_W, Math.min(MAX_W, side === 'left' ? startW + delta : startW - delta))
      setLayout(prev => ({ ...prev, [side === 'left' ? 'leftW' : 'rightW']: w }))
    }
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); document.body.style.cursor=''; document.body.style.userSelect='' }
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp)
    document.body.style.cursor = 'ew-resize'; document.body.style.userSelect = 'none'
  }

  // ── Row resize (drag the divider between two stacked groups in a column) ──
  // Groups in a column flex by weight (`h`). On drag start we freeze every group's
  // weight to its current pixel height so only the dragged pair's heights change.
  function startRowResize(side: 'left'|'right', index: number, e: ReactPointerEvent) {
    e.preventDefault(); e.stopPropagation()
    const root = bodyAreaRef.current
    if (!root) return
    const els = Array.from(root.querySelectorAll(`[data-grp][data-side="${side}"]`)) as HTMLElement[]
    const heights = els.map(el => el.getBoundingClientRect().height)
    setLayout(prev => ({ ...prev, [side]: prev[side].map((g, i) => ({ ...g, h: heights[i] ?? g.h ?? 1 })) }))
    const startY = e.clientY
    const h1 = heights[index] ?? 0, h2 = heights[index + 1] ?? 0, total = h1 + h2
    const onMove = (ev: PointerEvent) => {
      const n1 = Math.max(MIN_H, Math.min(total - MIN_H, h1 + (ev.clientY - startY)))
      const n2 = total - n1
      setLayout(prev => {
        const arr = [...prev[side]]
        if (arr[index])     arr[index]     = { ...arr[index],     h: n1 }
        if (arr[index + 1]) arr[index + 1] = { ...arr[index + 1], h: n2 }
        return { ...prev, [side]: arr }
      })
    }
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); document.body.style.cursor=''; document.body.style.userSelect='' }
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp)
    document.body.style.cursor = 'ns-resize'; document.body.style.userSelect = 'none'
  }

  // ── Float toggles (roll-up to header bar / maximize to viewport) ──
  const toggleRoll = (gid: string) => setLayout(prev => ({ ...prev, float: prev.float.map(g => g.id===gid ? { ...g, rolled: !g.rolled } : g) }))
  const toggleMax  = (gid: string) => setLayout(prev => ({ ...prev, float: prev.float.map(g => g.id===gid ? { ...g, max: !g.max } : g) }))

  // ── Float snapping (magnetic alignment to viewport edges and other floats) ──
  // Mirrors Syncfusion's EnableSnappingFloatWindow: a float's edge snaps to the
  // viewport bounds or to any other float's edge so windows line up cleanly.
  const SNAP = 9
  function snapFloat(left: number, top: number, width: number, height: number): { left: number; top: number } {
    const xs: number[] = [], ys: number[] = []
    const b = bodyAreaRef.current?.getBoundingClientRect()
    if (b) { xs.push(b.left, b.right); ys.push(b.top, b.bottom) }
    const dragged = dragPanelRef.current
    for (const g of layout.float) {
      if (dragged && g.panels.includes(dragged)) continue   // ignore the window being moved
      const el = document.querySelector(`[data-floatgrp="${g.id}"]`) as HTMLElement | null
      const r = el?.getBoundingClientRect(); if (!r) continue
      xs.push(r.left, r.right); ys.push(r.top, r.bottom)
    }
    let L = left, T = top
    for (const x of xs) {
      if (Math.abs(L - x) <= SNAP) { L = x; break }                 // align left edge
      if (Math.abs(L + width - x) <= SNAP) { L = x - width; break } // align right edge
    }
    for (const yy of ys) {
      if (Math.abs(T - yy) <= SNAP) { T = yy; break }                  // align top edge
      if (Math.abs(T + height - yy) <= SNAP) { T = yy - height; break } // align bottom edge
    }
    return { left: L, top: T }
  }

  // ── Drag-to-dock: VS-style guide diamond ──
  // Build the guide indicators for the current cursor: window-edge arrows (dock to
  // a new left/right column) + a 5-way compass over the pane under the cursor
  // (centre = merge as tab, N/S = split above/below, W/E = dock to a side column).
  const GUIDE_HIT = 20
  function computeGuides(x: number, y: number): Guide[] {
    const root = bodyAreaRef.current
    const b = root?.getBoundingClientRect()
    if (!root || !b) return []
    const R = (l: number, t: number, w: number, h: number): GuideRect => ({ left: l, top: t, width: w, height: h })
    const out: Guide[] = []
    out.push({ id:'win-w', cx:b.left+24,  cy:b.top+b.height/2, dir:'W', tgt:{type:'newcol',side:'left'},  rect:R(b.left, b.top, DEF_W, b.height) })
    out.push({ id:'win-e', cx:b.right-24, cy:b.top+b.height/2, dir:'E', tgt:{type:'newcol',side:'right'}, rect:R(b.right-DEF_W, b.top, DEF_W, b.height) })
    const boxes = Array.from(root.querySelectorAll('[data-grp]')) as HTMLElement[]
    for (const el of boxes) {
      const r = el.getBoundingClientRect()
      if (x>=r.left && x<=r.right && y>=r.top && y<=r.bottom) {
        const side = el.getAttribute('data-side') as DockSideKey
        if (side === 'float') break
        const gid = el.getAttribute('data-grp')!
        const cx = r.left+r.width/2, cy = r.top+r.height/2, D = 38
        const box = R(r.left, r.top, r.width, r.height)
        out.push({ id:'d-c', cx,        cy,        dir:'C', tgt:{type:'tabs', side, gid},                     rect:box })
        out.push({ id:'d-n', cx,        cy:cy-D,   dir:'N', tgt:{type:'split', side, gid, where:'top'},       rect:R(r.left, r.top, r.width, r.height/2) })
        out.push({ id:'d-s', cx,        cy:cy+D,   dir:'S', tgt:{type:'split', side, gid, where:'bottom'},    rect:R(r.left, r.top+r.height/2, r.width, r.height/2) })
        out.push({ id:'d-w', cx:cx-D,   cy,        dir:'W', tgt:{type:'newcol', side:'left'},                 rect:R(b.left, b.top, DEF_W, b.height) })
        out.push({ id:'d-e', cx:cx+D,   cy,        dir:'E', tgt:{type:'newcol', side:'right'},                rect:R(b.right-DEF_W, b.top, DEF_W, b.height) })
        break
      }
    }
    return out
  }
  function guideHit(x: number, y: number, gs: Guide[]): Guide | null {
    let best: Guide | null = null, bd = GUIDE_HIT
    for (const g of gs) { const d = Math.hypot(x-g.cx, y-g.cy); if (d <= bd) { bd = d; best = g } }
    return best
  }
  // Where the panel lands when NOT dropped on a guide: a floating window (snapped).
  function floatTarget(x: number, y: number): { tgt: DropTarget; rect: GuideRect } {
    const fw = dragSize.current.w, fh = dragSize.current.h
    const s = snapFloat(Math.max(8, x - fw/2), Math.max(56, y - 14), fw, fh)
    return { tgt:{type:'float', x:s.left, y:s.top}, rect:{ left:s.left, top:s.top, width:fw, height:fh } }
  }
  function startPanelDrag(panel: PanelId, e: ReactPointerEvent) {
    if (e.button !== 0) return
    e.preventDefault()
    dragPanelRef.current = panel; dragStartPt.current = {x:e.clientX,y:e.clientY}; dragMoved.current = false
    const box = (e.currentTarget as HTMLElement).closest('[data-grp]') as HTMLElement | null
    const r = box?.getBoundingClientRect(); dragSize.current = { w:r?.width||256, h:r?.height||300 }
    setDocking(true)
  }
  useEffect(() => {
    if (!docking) return
    const move = (e: PointerEvent) => {
      if (Math.hypot(e.clientX-dragStartPt.current.x, e.clientY-dragStartPt.current.y) > 5) dragMoved.current = true
      if (!dragMoved.current) { setGhostRect(null); setGuides([]); return }
      const gs = computeGuides(e.clientX, e.clientY)
      const hit = guideHit(e.clientX, e.clientY, gs)
      setGuides(gs); setActiveGuideId(hit?.id ?? null)
      setGhostRect(hit ? hit.rect : floatTarget(e.clientX, e.clientY).rect)
    }
    const up = (e: PointerEvent) => {
      const p = dragPanelRef.current
      if (p) {
        if (!dragMoved.current) setLayout(prev => activatePanel(prev, p))
        else {
          const hit = guideHit(e.clientX, e.clientY, computeGuides(e.clientX, e.clientY))
          const tgt = hit ? hit.tgt : floatTarget(e.clientX, e.clientY).tgt
          setLayout(prev => applyDrop(prev, p, tgt))
        }
      }
      dragPanelRef.current = null; setDocking(false); setGhostRect(null); setGuides([]); setActiveGuideId(null)
    }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [docking]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tab context menu ──
  const floatHere = (panel: PanelId) => {
    const b = bodyAreaRef.current?.getBoundingClientRect()
    const x = (b ? b.left + b.width/2 : 200), y = (b ? b.top + b.height/3 : 120)
    setLayout(prev => applyDrop(prev, panel, { type:'float', x, y }))
  }
  const tabMenuItems = (panel: PanelId): MenuItem[] => [
    { type:'label', text: String((panels[panel]?.label as string) ?? panel) },
    { type:'separator' },
    { type:'action', label:'Détacher (flottant)', onClick: () => floatHere(panel) },
    { type:'action', label:'Ancrer à gauche', onClick: () => setLayout(prev => applyDrop(prev, panel, { type:'newcol', side:'left' })) },
    { type:'action', label:'Ancrer à droite', onClick: () => setLayout(prev => applyDrop(prev, panel, { type:'newcol', side:'right' })) },
    { type:'separator' },
    { type:'action', label:'Fermer le panneau', danger:true, onClick: () => setLayout(prev => closePanel(prev, panel)) },
    { type:'separator' },
    { type:'action', label:'Réinitialiser la disposition', onClick: resetLayout },
  ]

  // ── Rendering ──
  const groupBox = (grp: DockGroup, side: DockSideKey) => (
    <div key={grp.id} data-grp={grp.id} data-side={side} className="flex flex-col min-h-0" style={{ flex: side==='float' ? '1 1 auto' : `${grp.h ?? 1} 1 0` }}>
      <div data-strip className="flex flex-shrink-0 flex-wrap items-stretch" style={{ background:theme.header, borderBottom:`1px solid ${theme.border}` }}>
        {grp.panels.map(p => {
          const active = grp.active === p
          return (
            <div key={p}
                 onPointerDown={(e)=>startPanelDrag(p, e)}
                 onDoubleClick={() => side==='float'
                   ? setLayout(prev => applyDrop(prev, p, { type:'newcol', side:'right' }))
                   : floatHere(p)}
                 onContextMenu={(e)=>{ e.preventDefault(); setTabMenu({ pos:{ top:e.clientY, left:e.clientX, minWidth:200 }, panel:p }) }}
                 title={moveTitle}
                 className="group/tab relative flex items-center gap-1 px-2.5 h-7 text-[11px] font-medium cursor-grab select-none"
                 style={{ color: active?theme.text:theme.textDim, background: active?theme.panel:'transparent',
                          borderRight:`1px solid ${theme.border}`,
                          boxShadow: active ? `inset 0 2px 0 ${theme.accent ?? '#1a73e8'}` : undefined }}>
              <span className="truncate max-w-[140px]">{panels[p]?.label}</span>
              <button type="button" title="Fermer"
                onPointerDown={(e)=>e.stopPropagation()}
                onClick={(e)=>{ e.stopPropagation(); setLayout(prev => closePanel(prev, p)) }}
                className={`flex items-center justify-center rounded p-0.5 ${active ? 'opacity-60' : 'opacity-0 group-hover/tab:opacity-60'} hover:opacity-100 hover:bg-black/10`}
                style={{ color: theme.textDim }}>
                <X size={11} />
              </button>
            </div>
          )
        })}
        {/* Float-only caption controls: roll-up to header + maximize to viewport. */}
        {side==='float' && (
          <div className="ml-auto flex items-center pr-1" style={{ color: theme.textDim }}>
            <button type="button" title={grp.rolled ? 'Dérouler' : 'Enrouler'}
              onPointerDown={(e)=>e.stopPropagation()} onClick={(e)=>{ e.stopPropagation(); toggleRoll(grp.id) }}
              className="flex items-center justify-center rounded p-1 opacity-60 hover:opacity-100 hover:bg-black/10">
              {grp.rolled ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </button>
            <button type="button" title={grp.max ? 'Restaurer' : 'Agrandir'}
              onPointerDown={(e)=>e.stopPropagation()} onClick={(e)=>{ e.stopPropagation(); toggleMax(grp.id) }}
              className="flex items-center justify-center rounded p-1 opacity-60 hover:opacity-100 hover:bg-black/10">
              {grp.max ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            </button>
          </div>
        )}
      </div>
      {!(side==='float' && grp.rolled) && (
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">{panels[grp.active]?.render()}</div>
      )}
    </div>
  )

  const column = (side: 'left'|'right') => {
    const groups = layout[side]; if (!groups.length) return null
    const w = (side === 'left' ? layout.leftW : layout.rightW) ?? DEF_W
    const resizer = (
      <div key={`${side}-rz`} onPointerDown={(e)=>startColResize(side, e)}
           className="group/rz relative flex-shrink-0 w-1.5 cursor-ew-resize"
           style={{ order: side==='left'?1:3, background:'transparent' }}>
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px transition-colors group-hover/rz:bg-primary" style={{ background:theme.border }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/rz:opacity-100 transition" style={{ color:theme.textDim }}>
          <GripVertical size={11} />
        </div>
      </div>
    )
    const col = (
      <div key={side} className="flex flex-col flex-shrink-0"
           style={{ width:w, background:theme.panel, order: side==='left'?0:4,
                    borderLeft: side==='right'?`1px solid ${theme.border}`:'none',
                    borderRight: side==='left'?`1px solid ${theme.border}`:'none' }}>
        {groups.map((grp, i) => (
          <Fragment key={grp.id}>
            {groupBox(grp, side)}
            {/* Vertical resizer between two stacked groups (only when ≥2 in the column). */}
            {i < groups.length - 1 && (
              <div onPointerDown={(e)=>startRowResize(side, i, e)}
                   className="group/rzv relative flex-shrink-0 h-1.5 cursor-ns-resize"
                   title={moveTitle}>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px transition-colors group-hover/rzv:bg-primary" style={{ background:theme.border }} />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/rzv:opacity-100 transition" style={{ color:theme.textDim }}>
                  <GripHorizontal size={11} />
                </div>
              </div>
            )}
          </Fragment>
        ))}
      </div>
    )
    return side==='left' ? [col, resizer] : [resizer, col]
  }

  const bodyRect = bodyAreaRef.current?.getBoundingClientRect()
  const floats = layout.float.map(grp => {
    const maxed = grp.max && bodyRect
    const posStyle: CSSProperties = maxed
      ? { left: bodyRect!.left, top: bodyRect!.top, width: bodyRect!.width, height: bodyRect!.height }
      : { left: grp.x, top: grp.y, width: DEF_W, maxHeight: grp.rolled ? undefined : '72vh' }
    return (
      <div key={grp.id} data-floatgrp={grp.id} className="fixed flex flex-col shadow-2xl rounded-md overflow-hidden"
           style={{ ...posStyle, background:theme.panel, border:`1px solid ${theme.border}`, zIndex:80 }}>
        {groupBox(grp, 'float')}
      </div>
    )
  })

  const closed = layout.closed ?? []

  return (
    <>
      <div className={className} style={{ ...style, position:'relative' }} ref={bodyAreaRef}>
        <div className="flex-1 relative overflow-hidden flex flex-col min-w-0" style={{ background:viewportBg, order:2 }} ref={viewportRef}>
          {children}
          {/* Reopen closed panels (top-right of the viewport) */}
          {!hidden && closed.length > 0 && (
            <button type="button" title="Panneaux fermés"
              onClick={(e)=>setOpenMenu({ top:e.clientY+6, left:e.clientX-160, minWidth:180 })}
              className="absolute top-2 right-2 z-30 flex items-center gap-1 rounded-md px-2 h-7 text-[11px] shadow-sm"
              style={{ background:theme.panel, border:`1px solid ${theme.border}`, color:theme.textDim }}>
              <Plus size={13} /> Panneaux ({closed.length})
            </button>
          )}
        </div>
        {!hidden && column('left')}
        {!hidden && column('right')}
        {!hidden && floats}
      </div>

      {/* Ghost rectangle = exact landing zone of the dragged panel. */}
      {docking && ghostRect && (
        <div className="fixed inset-0 z-[100]" style={{ cursor:'grabbing' }}>
          <div className="absolute" style={{ left:ghostRect.left, top:ghostRect.top, width:ghostRect.width, height:ghostRect.height,
                        background:'rgba(90,160,255,0.22)', border:'2px solid rgba(90,160,255,0.95)', borderRadius:4 }} />
        </div>
      )}

      {/* Guide diamond + edge arrows (VS-style dock indicators). */}
      {docking && guides.length > 0 && (
        <div className="fixed inset-0 z-[101] pointer-events-none">
          {guides.map(g => {
            const active = g.id === activeGuideId
            const Icon = g.dir==='N' ? ChevronUp : g.dir==='S' ? ChevronDown : g.dir==='W' ? ChevronLeft : g.dir==='E' ? ChevronRight : Square
            return (
              <div key={g.id}
                style={{ position:'absolute', left:g.cx-15, top:g.cy-15, width:30, height:30,
                         background: active ? '#1a73e8' : 'rgba(255,255,255,0.96)',
                         color: active ? '#fff' : '#5f6368',
                         border:`1px solid ${active ? '#1a73e8' : '#bdc1c6'}`,
                         transform: active ? 'scale(1.12)' : 'none', transition:'transform .08s, background .08s' }}
                className="flex items-center justify-center rounded-md shadow-md">
                <Icon size={g.dir==='C' ? 13 : 16} {...(g.dir==='C' && active ? { fill:'#fff' } : g.dir==='C' ? { fill:'#5f6368' } : {})} />
              </div>
            )
          })}
        </div>
      )}

      {tabMenu && <MenuDropdown items={tabMenuItems(tabMenu.panel)} pos={tabMenu.pos} onClose={()=>setTabMenu(null)} />}
      {openMenu && (
        <MenuDropdown
          items={closed.length
            ? closed.map(p => ({ type:'action' as const, label: String((panels[p]?.label as string) ?? p), onClick: () => setLayout(prev => openPanel(prev, p)) }))
            : [{ type:'label' as const, text:'Aucun panneau fermé' }]}
          pos={openMenu} onClose={()=>setOpenMenu(null)} />
      )}
    </>
  )
}
