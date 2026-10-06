export interface ToggleGeometry {
    width: number;
    height: number;
    trackRadius: number;
    thumbSize: number;
    thumbRadius: number;
    /** Gap between the track edge and the thumb, on all four sides. */
    thumbInset: number;
}
export declare const TOGGLE_GEOMETRY: Record<'sm' | 'md', ToggleGeometry>;
export interface TogglePalette {
    /** Track fill when off. */
    off: string;
    /** Track outline when off. */
    border: string;
    /** Track fill and outline when on. */
    on: string;
    thumb: string;
}
export declare function readTogglePalette(el: Element): TogglePalette;
export interface PaintToggleOptions {
    geometry: ToggleGeometry;
    palette: TogglePalette;
    /** 0 = off, 1 = on. Intermediate values are the sliding animation. */
    progress: number;
    /** Defaults to `window.devicePixelRatio`; injectable for tests. */
    dpr?: number;
}
export declare function paintToggle(canvas: HTMLCanvasElement, opts: PaintToggleOptions): void;
