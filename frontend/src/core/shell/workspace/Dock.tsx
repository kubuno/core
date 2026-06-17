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
import { useEffect, useRef, useState } from 'react'
import type { ReactNode, CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { X, Plus, GripVertical } from 'lucide-react'
import { MenuDropdown, type MenuItem, type MenuDropdownPos } from '@ui'

export type PanelId = string
export type DockSideKey = 'left' | 'right' | 'float'
export interface DockGroup { id: string; panels: PanelId[]; active: PanelId; x?: number; y?: number }
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

  // ── Drag-to-dock hit testing ──
  function computeDropTarget(x:number, y:number): { tgt:DropTarget; rect:{left:number;top:number;width:number;height:number} } {
    const root = bodyAreaRef.current ?? document
    const boxes = Array.from(root.querySelectorAll('[data-grp]')) as HTMLElement[]
    for (const el of boxes) {
      const r = el.getBoundingClientRect()
      if (x>=r.left && x<=r.right && y>=r.top && y<=r.bottom) {
        const side = el.getAttribute('data-side') as DockSideKey
        const gid = el.getAttribute('data-grp')!
        const strip = el.querySelector('[data-strip]') as HTMLElement | null
        const box = { left:r.left, top:r.top, width:r.width, height:r.height }
        if (strip) { const sr = strip.getBoundingClientRect(); if (y <= sr.bottom) return { tgt:{type:'tabs',side,gid}, rect:box } }
        const rel = (y - r.top) / r.height
        if (side!=='float' && rel<0.30) return { tgt:{type:'split',side,gid,where:'top'}, rect:{...box, height:r.height/2} }
        if (side!=='float' && rel>0.70) return { tgt:{type:'split',side,gid,where:'bottom'}, rect:{...box, top:r.top+r.height/2, height:r.height/2} }
        return { tgt:{type:'tabs',side,gid}, rect:box }
      }
    }
    const b = bodyAreaRef.current?.getBoundingClientRect()
    if (b && x < b.left+60)  return { tgt:{type:'newcol',side:'left'},  rect:{left:b.left, top:b.top, width:DEF_W, height:b.height} }
    if (b && x > b.right-60)  return { tgt:{type:'newcol',side:'right'}, rect:{left:b.right-DEF_W, top:b.top, width:DEF_W, height:b.height} }
    return { tgt:{type:'float',x,y}, rect:{left:Math.max(8,x-dragSize.current.w/2), top:Math.max(56,y-14), width:dragSize.current.w, height:dragSize.current.h} }
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
      setGhostRect(dragMoved.current ? computeDropTarget(e.clientX, e.clientY).rect : null)
    }
    const up = (e: PointerEvent) => {
      const p = dragPanelRef.current
      if (p) {
        if (!dragMoved.current) setLayout(prev => activatePanel(prev, p))
        else { const { tgt } = computeDropTarget(e.clientX, e.clientY); setLayout(prev => applyDrop(prev, p, tgt)) }
      }
      dragPanelRef.current = null; setDocking(false); setGhostRect(null)
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
    <div key={grp.id} data-grp={grp.id} data-side={side} className="flex flex-col min-h-0" style={{ flex: side==='float' ? '1 1 auto' : 1 }}>
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
      </div>
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">{panels[grp.active]?.render()}</div>
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
        {groups.map(grp => groupBox(grp, side))}
      </div>
    )
    return side==='left' ? [col, resizer] : [resizer, col]
  }

  const floats = layout.float.map(grp => (
    <div key={grp.id} className="fixed flex flex-col shadow-2xl rounded-md overflow-hidden"
         style={{ left:grp.x, top:grp.y, width:DEF_W, maxHeight:'72vh', background:theme.panel,
                  border:`1px solid ${theme.border}`, zIndex:80 }}>
      {groupBox(grp, 'float')}
    </div>
  ))

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
