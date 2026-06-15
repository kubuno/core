export declare const COLS = 12;
export declare const ROW_H = 80;
export declare const GAP = 16;
export interface GridPos {
    col: number;
    row: number;
    colSpan: number;
    rowSpan: number;
}
export interface GridItem {
    id: string;
    pos: GridPos;
}
export interface GhostState {
    col: number;
    row: number;
    colSpan: number;
    rowSpan: number;
    visible: boolean;
}
export interface DragState {
    widgetId: string;
    colSpan: number;
    rowSpan: number;
    startMouseX: number;
    startMouseY: number;
    startCol: number;
    startRow: number;
    originCol: number;
    originRow: number;
}
export interface ResizeState {
    widgetId: string;
    startMouseX: number;
    startMouseY: number;
    startColSpan: number;
    startRowSpan: number;
    col: number;
    row: number;
    edge: 'right' | 'bottom' | 'corner';
}
export declare function posToWidgetSize(colSpan: number): 'small' | 'medium' | 'large';
export declare function widgetSizeToDefaultColSpan(size?: string): number;
