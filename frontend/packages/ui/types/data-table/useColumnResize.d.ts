/**
 * Column resizing for the table layout.
 *
 * Two things are worth knowing here:
 *
 * 1. The table switches to `table-layout: fixed` as soon as ONE column has been
 *    resized, and every column's current width is snapshotted at that moment. In
 *    `auto` layout a width is only a hint — the browser re-solves the whole row
 *    from the content, so dragging one edge would shuffle the others. Snapshotting
 *    first is what makes a drag move a single boundary.
 *
 * 2. The pointer is captured on the handle, so the drag survives the cursor
 *    leaving the 5px strip — which it does immediately on any real gesture.
 */
export declare function useColumnResize(): {
    widths: Record<string, number>;
    pinned: boolean;
    begin: (e: React.PointerEvent<HTMLElement>, colId: string) => void;
    move: (e: React.PointerEvent<HTMLElement>) => void;
    end: (e: React.PointerEvent<HTMLElement>) => void;
    nudge: (colId: string, delta: number, handle: HTMLElement) => void;
    reset: (colId: string) => void;
};
