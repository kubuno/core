export interface RadioGeometry {
    /** Overall box, square. */
    size: number;
    /** Ring thickness. */
    ring: number;
    /** Diameter of the inner dot when fully checked. */
    dot: number;
}
export declare const RADIO_GEOMETRY: RadioGeometry;
export interface RadioPalette {
    /** Ring when unchecked. */
    border: string;
    /** Ring when unchecked and hovered. */
    borderHover: string;
    /** Ring when checked, and the dot. */
    accent: string;
}
export type RadioVariant = 'default' | 'dark';
export declare function readRadioPalette(el: Element, variant: RadioVariant, color?: string): RadioPalette;
export interface PaintRadioOptions {
    geometry: RadioGeometry;
    palette: RadioPalette;
    /** 0 = unchecked, 1 = checked. Intermediate values are the dot growing in. */
    progress: number;
    hovered?: boolean;
    /** Defaults to `window.devicePixelRatio`; injectable for tests. */
    dpr?: number;
}
export declare function paintRadio(canvas: HTMLCanvasElement, opts: PaintRadioOptions): void;
