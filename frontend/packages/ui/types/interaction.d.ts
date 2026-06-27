import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
/** True when the primary pointer is coarse (touch) and hovering is unavailable
 *  — i.e. double-click is not a sensible gesture and a tap should "open". */
export declare function isCoarsePointer(): boolean;
type AnyMouseEvent = {
    stopPropagation(): void;
    preventDefault(): void;
};
/**
 * Build `{ onClick, onDoubleClick }` props for an element whose desktop
 * behaviour is "single click selects, double click opens". On touch UIs the
 * single tap opens directly (and the desktop select handler is skipped).
 *
 *   <div {...openable<React.MouseEvent>({ open, select })} />
 *
 * `select` is optional: items with no selection concept just open on tap (touch)
 * or double-click (mouse).
 */
export declare function openable<E extends AnyMouseEvent>(opts: {
    open: (e: E) => void;
    select?: (e: E) => void;
}): {
    onClick: (e: E) => void;
    onDoubleClick: (e: E) => void;
};
/**
 * Long-press → context menu. Touch UIs have no right-click; a sustained press
 * fires the same `onContextMenu`-style handler with a synthesized event whose
 * `clientX/clientY` is the touch point (so existing menu-positioning code works
 * unchanged). The tap that the browser would emit on touchend is swallowed in
 * the capture phase so the item isn't also opened/selected.
 *
 *   const longPress = useLongPress(onContextMenu)
 *   <div {...longPress} onContextMenu={onContextMenu} />   // mouse keeps right-click
 */
export declare function useLongPress(handler: (e: ReactMouseEvent) => void, opts?: {
    ms?: number;
    moveTolerance?: number;
}): {
    onTouchStart: (e: ReactTouchEvent) => void;
    onTouchMove: (e: ReactTouchEvent) => void;
    onTouchEnd: () => void;
    onTouchCancel: () => void;
};
export {};
