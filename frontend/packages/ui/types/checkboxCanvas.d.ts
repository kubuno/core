export interface CheckboxGeometry {
    /** Overall box, square. */
    size: number;
    /** Border thickness when unchecked. */
    border: number;
    /** Corner radius of the box. */
    radius: number;
    /** Side of the square the tick is drawn inside. */
    tick: number;
}
export declare const CHECKBOX_GEOMETRY: CheckboxGeometry;
export interface CheckboxPalette {
    /** Box fill when unchecked. `null` = transparent. */
    fill: string | null;
    border: string;
    borderHover: string;
    /** Fill and border when checked, and the indeterminate dash. */
    accent: string;
    /** The tick itself, drawn over the accent fill. */
    mark: string;
}
export type CheckboxVariant = 'default' | 'dark';
export declare function readCheckboxPalette(el: Element, variant: CheckboxVariant, color?: string): CheckboxPalette;
export interface PaintCheckboxOptions {
    geometry: CheckboxGeometry;
    palette: CheckboxPalette;
    /** 0 = unchecked, 1 = checked. Intermediate values are the mark scaling in. */
    progress: number;
    /** Tri-state: drawn as a dash instead of a tick. Wins over `progress`. */
    indeterminate?: boolean;
    hovered?: boolean;
    /** Defaults to `window.devicePixelRatio`; injectable for tests. */
    dpr?: number;
}
export declare function paintCheckbox(canvas: HTMLCanvasElement, opts: PaintCheckboxOptions): void;
