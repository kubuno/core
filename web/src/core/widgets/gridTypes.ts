export const COLS = 12
export const ROW_H = 80   // px per row
export const GAP   = 16   // gap between cells (px)

export interface GridPos {
  col:     number   // 1-based column start
  row:     number   // 1-based row start
  colSpan: number   // number of columns
  rowSpan: number   // number of rows
}

export interface GridItem {
  id:  string
  pos: GridPos
}

export interface GhostState {
  col:     number
  row:     number
  colSpan: number
  rowSpan: number
  visible: boolean
}

export interface DragState {
  widgetId:     string
  colSpan:      number
  rowSpan:      number
  startMouseX:  number
  startMouseY:  number
  startCol:     number
  startRow:     number
  originCol:    number   // widget's col at drag start
  originRow:    number   // widget's row at drag start
}

export interface ResizeState {
  widgetId:  string
  startMouseX: number
  startMouseY: number
  startColSpan: number
  startRowSpan: number
  col:  number
  row:  number
  edge: 'right' | 'bottom' | 'corner'
}

export function posToWidgetSize(colSpan: number): 'small' | 'medium' | 'large' {
  if (colSpan >= 10) return 'large'
  if (colSpan >= 5)  return 'medium'
  return 'small'
}

export function widgetSizeToDefaultColSpan(size?: string): number {
  if (size === 'large')  return 12
  if (size === 'medium') return 6
  return 4
}
