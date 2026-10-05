export interface VirtualList {
    /** The scroll container. */
    ref: (el: HTMLElement | null) => void;
    onScroll: (e: React.UIEvent<HTMLElement>) => void;
    /** The rows to render (`end` exclusive). */
    start: number;
    end: number;
    /** The viewport height, in rows (Page Up / Page Down). */
    pageRows: number;
    /** Scrolls so that row `index` shows. */
    reveal: (index: number) => void;
}
export declare function useVirtualList(count: number, rowHeight: number, header?: number): VirtualList;
