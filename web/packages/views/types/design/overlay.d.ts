/**
 * Draws the adorners of the design surface into its overlay layer (vskubuno docs/DESIGNER.md §9 "Adorners",
 * WEB-VIEWS.md §4.3): faint outlines of containers that paint nothing, the hover stroke, the dashed outline of
 * the primary selection's parent, a frame 3 px outside each selected element with its 8 grab handles (filled when
 * the handle resizes the element), and the drag feedback (insertion marker, dock band, move / resize ghost with its
 * size). Rectangles are page (viewport) px; the layer is positioned at `origin`.
 */
import { type Handle, type Rect } from './geometry';
export interface SelectedAdorner {
    readonly bounds: Rect;
    readonly primary: boolean;
    readonly resizable: ReadonlySet<Handle>;
}
export interface AdornerSpec {
    readonly outlines: readonly Rect[];
    readonly hover: Rect | null;
    readonly parent: Rect | null;
    readonly selected: readonly SelectedAdorner[];
    readonly marker?: {
        readonly rect: Rect;
        readonly kind: 'line' | 'box' | 'ghost';
        readonly valid: boolean;
    } | null;
    readonly band?: Rect | null;
    readonly ghost?: Rect | null;
    readonly tip?: {
        readonly x: number;
        readonly y: number;
        readonly text: string;
    } | null;
}
/** Replaces the layer's adorners with the ones `spec` describes. */
export declare function drawAdorners(layer: HTMLElement, origin: {
    left: number;
    top: number;
}, spec: AdornerSpec): void;
/** The cursor of a grab handle. */
export declare function handleCursor(h: Handle): string;
