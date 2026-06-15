import { useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { COLS, ROW_H, GAP, type GridPos, type DragState, type ResizeState, type GhostState } from './gridTypes'
import { useGridLayout } from './useGridLayout'
import GridWidget from './GridWidget'
import type { WidgetDef } from './WidgetRegistry'

interface Props {
  allWidgets:  WidgetDef[]
  activeIds:   Set<string>
  editMode:    boolean
}

const MIN_COL_SPAN = 2
const MIN_ROW_SPAN = 2

export default function GridDashboard({ allWidgets, activeIds, editMode }: Props) {
  const { t } = useTranslation()
  const {
    gridItems, hiddenWidgets,
    moveWidget, resizeWidget, removeWidget, addWidget,
    getConfig, setConfig,
  } = useGridLayout(activeIds)

  const gridRef     = useRef<HTMLDivElement>(null)
  const ghostRef    = useRef<HTMLDivElement>(null)
  const dragRef     = useRef<DragState | null>(null)
  const resizeRef   = useRef<ResizeState | null>(null)

  const [ghost, setGhost]       = useState<GhostState | null>(null)
  const [landingId, setLandingId] = useState<string | null>(null)

  // Derive max row from grid items so grid auto-expands
  const maxRow = gridItems.reduce((m, i) => Math.max(m, i.pos.row + i.pos.rowSpan - 1), 6)
  const gridRows = maxRow + 2  // spare rows at bottom

  function getCellWidth(): number {
    if (!gridRef.current) return 80
    return (gridRef.current.clientWidth - (COLS - 1) * GAP) / COLS
  }

  function mouseToCell(clientX: number, clientY: number): { col: number; row: number } {
    if (!gridRef.current) return { col: 1, row: 1 }
    const rect = gridRef.current.getBoundingClientRect()
    const cellW = getCellWidth()
    const cellH = ROW_H + GAP
    const col = Math.max(1, Math.min(COLS, Math.floor((clientX - rect.left) / cellW) + 1))
    const row = Math.max(1, Math.floor((clientY - rect.top + gridRef.current.scrollTop) / cellH) + 1)
    return { col, row }
  }

  function clampPos(col: number, row: number, colSpan: number, rowSpan: number): GridPos {
    const safeCol = Math.max(1, Math.min(col, COLS - colSpan + 1))
    const safeRow = Math.max(1, row)
    return { col: safeCol, row: safeRow, colSpan, rowSpan }
  }

  // ── Drag ────────────────────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.PointerEvent, widgetId: string) => {
    if (!editMode) return
    e.preventDefault()
    e.stopPropagation()

    const item = gridItems.find(i => i.id === widgetId)
    if (!item) return

    const { col, row } = mouseToCell(e.clientX, e.clientY)

    dragRef.current = {
      widgetId,
      colSpan:     item.pos.colSpan,
      rowSpan:     item.pos.rowSpan,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startCol:    col,
      startRow:    row,
      originCol:   item.pos.col,
      originRow:   item.pos.row,
    }
    setGhost({ col: item.pos.col, row: item.pos.row, colSpan: item.pos.colSpan, rowSpan: item.pos.rowSpan, visible: true })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [editMode, gridItems, mouseToCell])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!editMode) return

    if (dragRef.current) {
      const ds = dragRef.current
      const { col, row } = mouseToCell(e.clientX, e.clientY)
      const deltaCol = col - ds.startCol
      const deltaRow = row - ds.startRow
      const newCol = Math.max(1, Math.min(COLS - ds.colSpan + 1, ds.originCol + deltaCol))
      const newRow = Math.max(1, ds.originRow + deltaRow)
      setGhost({ col: newCol, row: newRow, colSpan: ds.colSpan, rowSpan: ds.rowSpan, visible: true })
      return
    }

    if (resizeRef.current) {
      const rs = resizeRef.current
      const cellW = getCellWidth()
      const cellH = ROW_H + GAP
      const dxCells = Math.round((e.clientX - rs.startMouseX) / cellW)
      const dyCells = Math.round((e.clientY - rs.startMouseY) / cellH)

      let newColSpan = rs.startColSpan
      let newRowSpan = rs.startRowSpan

      if (rs.edge === 'right' || rs.edge === 'corner') {
        newColSpan = Math.max(MIN_COL_SPAN, Math.min(COLS - rs.col + 1, rs.startColSpan + dxCells))
      }
      if (rs.edge === 'bottom' || rs.edge === 'corner') {
        newRowSpan = Math.max(MIN_ROW_SPAN, rs.startRowSpan + dyCells)
      }

      setGhost({ col: rs.col, row: rs.row, colSpan: newColSpan, rowSpan: newRowSpan, visible: true })
    }
  }, [editMode, mouseToCell, getCellWidth])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!editMode) return

    if (dragRef.current) {
      const ds = dragRef.current
      const { col, row } = mouseToCell(e.clientX, e.clientY)
      const deltaCol = col - ds.startCol
      const deltaRow = row - ds.startRow
      const newPos = clampPos(ds.originCol + deltaCol, ds.originRow + deltaRow, ds.colSpan, ds.rowSpan)
      moveWidget(ds.widgetId, newPos)
      setLandingId(ds.widgetId)
      setTimeout(() => setLandingId(null), 350)
      dragRef.current = null
      setGhost(null)
    }

    if (resizeRef.current) {
      const rs = resizeRef.current
      if (ghost) {
        resizeWidget(rs.widgetId, { col: rs.col, row: rs.row, colSpan: ghost.colSpan, rowSpan: ghost.rowSpan })
        setLandingId(rs.widgetId)
        setTimeout(() => setLandingId(null), 350)
      }
      resizeRef.current = null
      setGhost(null)
    }
  }, [editMode, ghost, moveWidget, resizeWidget, mouseToCell, clampPos])

  // ── Resize ───────────────────────────────────────────────────────────────────

  const handleResizeStart = useCallback((e: React.PointerEvent, widgetId: string, edge: 'right' | 'bottom' | 'corner') => {
    if (!editMode) return
    e.preventDefault()
    e.stopPropagation()

    const item = gridItems.find(i => i.id === widgetId)
    if (!item) return

    resizeRef.current = {
      widgetId,
      startMouseX:  e.clientX,
      startMouseY:  e.clientY,
      startColSpan: item.pos.colSpan,
      startRowSpan: item.pos.rowSpan,
      col:          item.pos.col,
      row:          item.pos.row,
      edge,
    }
    setGhost({ ...item.pos, visible: true })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [editMode, gridItems])

  // ── Manual resize buttons ────────────────────────────────────────────────────

  const handleManualResize = useCallback((id: string, delta: 'col+' | 'col-' | 'row+' | 'row-') => {
    const item = gridItems.find(i => i.id === id)
    if (!item) return
    const p = item.pos
    let { col, row, colSpan, rowSpan } = p
    if (delta === 'col+') colSpan = Math.min(COLS - col + 1, colSpan + 1)
    if (delta === 'col-') colSpan = Math.max(MIN_COL_SPAN, colSpan - 1)
    if (delta === 'row+') rowSpan = rowSpan + 1
    if (delta === 'row-') rowSpan = Math.max(MIN_ROW_SPAN, rowSpan - 1)
    resizeWidget(id, { col, row, colSpan, rowSpan })
    setLandingId(id)
    setTimeout(() => setLandingId(null), 350)
  }, [gridItems, resizeWidget])

  // ── Ghost style ──────────────────────────────────────────────────────────────

  const ghostStyle = ghost ? {
    gridColumn: `${ghost.col} / span ${ghost.colSpan}`,
    gridRow:    `${ghost.row} / span ${ghost.rowSpan}`,
  } : undefined

  return (
    <div>
      {/* Grid */}
      <div
        ref={gridRef}
        onPointerMove={editMode ? handlePointerMove : undefined}
        onPointerUp={editMode ? handlePointerUp : undefined}
        style={{
          display:             'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridAutoRows:        `${ROW_H}px`,
          gap:                 `${GAP}px`,
          gridTemplateRows:    `repeat(${gridRows}, ${ROW_H}px)`,
          position:            'relative',
        }}
        className="w-full"
      >
        {/* Ghost preview */}
        {editMode && ghost?.visible && (
          <div
            ref={ghostRef}
            style={ghostStyle}
            className="pointer-events-none z-30 transition-none relative"
          >
            <div className="absolute top-4 inset-x-0 bottom-0 rounded-xl border-2 border-dashed border-primary bg-primary/10" />
          </div>
        )}

        {/* Widgets */}
        {gridItems.map(item => {
          const widgetDef = allWidgets.find(w => w.id === item.id)
          if (!widgetDef) return null
          return (
            <GridWidget
              key={item.id}
              widget={widgetDef}
              pos={item.pos}
              editMode={editMode}
              isLanding={landingId === item.id}
              config={getConfig(item.id)}
              onConfigChange={setConfig}
              onDragStart={handleDragStart}
              onResizeStart={handleResizeStart}
              onRemove={removeWidget}
              onManualResize={handleManualResize}
            />
          )
        })}
      </div>

      {/* Hidden widgets — add */}
      {editMode && hiddenWidgets.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-text-secondary mb-3">{t('home.add_widgets')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {hiddenWidgets.map(w => (
              <button
                key={w.id}
                onClick={() => addWidget(w.id)}
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-border
                           rounded-xl text-text-secondary hover:border-primary hover:text-primary
                           hover:bg-primary/5 transition-colors text-sm"
              >
                <Plus size={18} />
                <span className="text-center leading-tight capitalize">
                  {w.id.replace(/-/g, ' ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
