import React from 'react';
import { type GridPos } from './gridTypes';
import type { WidgetDef } from './WidgetRegistry';
interface Props {
    widget: WidgetDef;
    pos: GridPos;
    editMode: boolean;
    isLanding: boolean;
    config: Record<string, unknown>;
    mobile?: boolean;
    onConfigChange: (id: string, key: string, value: unknown) => void;
    onDragStart: (e: React.PointerEvent, widgetId: string) => void;
    onResizeStart: (e: React.PointerEvent, widgetId: string, edge: 'right' | 'bottom' | 'corner') => void;
    onRemove: (id: string) => void;
    onManualResize: (id: string, delta: 'col+' | 'col-' | 'row+' | 'row-') => void;
}
declare function GridWidget({ widget, pos, editMode, isLanding, config, mobile, onConfigChange, onDragStart, onResizeStart, onRemove, onManualResize, }: Props): React.JSX.Element;
declare const _default: React.MemoExoticComponent<typeof GridWidget>;
export default _default;
