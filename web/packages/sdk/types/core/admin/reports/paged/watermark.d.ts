import type { PageGeometry } from './geometry';
/**
 * The stamp across a report's sheets — text or image, and never an element.
 *
 * ## Why it is painted, not placed
 *
 * The first version was an absolutely positioned `<div>`. It looked right on
 * screen and printed wrong: a 22-sheet report came out on 17 pages. Bisecting
 * the CSS cleared the rotation, the overflow and the size in turn — only
 * removing the element restored the count. An out-of-flow box inside a
 * page-broken document perturbs this engine's fragmentation, full stop.
 *
 * So the stamp is a BACKGROUND: one SVG, sized to the sheet, handed over as a
 * `data:` URL. A background paints and takes part in no layout, so it cannot
 * move a cut by construction, and it lands behind the text for free.
 *
 * ⚠ The consumer must set `background-COLOR` on the sheet, never the `background`
 * shorthand: the shorthand resets `background-image` and silently erased this.
 */
export type WatermarkKind = 'none' | 'text' | 'image';
export interface WatermarkSpec {
    kind: WatermarkKind;
    /** The words, when `kind` is `text`. */
    text: string;
    /** A `data:` URL, when `kind` is `image`. Never a remote one — see `readImage`. */
    image: string | null;
    /** Multiplier on the size that fits the sheet by itself. 1 = that size. */
    scale: number;
    /** 0.02 … 0.6. Low enough to read through, high enough to see. */
    opacity: number;
    /** Degrees. Negative turns anticlockwise, the usual direction for a stamp. */
    angle: number;
}
export declare const NO_WATERMARK: WatermarkSpec;
/** Is there anything to paint? A kind without its content is not a watermark. */
export declare function hasWatermark(w: WatermarkSpec): boolean;
/**
 * The stamp as a CSS `url(...)`, or `undefined` when there is nothing to paint.
 *
 * The SVG is an isolated document: it cannot reach the page's web fonts, so the
 * family is named for the SYSTEM to resolve and falls back to whatever sans it
 * has. On something drawn at 15 % opacity that is not worth an embedded font.
 * ⚠ Kept in step with the platform stack (`--font-family-sans`, `index.css`) by
 * hand — it is the one place in this feature where a font is named statically
 * rather than measured, so a change of stack has to be copied here.
 */
export declare function stampUrl(g: PageGeometry, w: WatermarkSpec): string | undefined;
/**
 * Read a picked file into a `data:` URL, downscaled first.
 *
 * Downscaling is not politeness: the URL is inlined in a CSS property that every
 * sheet and every thumbnail reads, so a 6-megapixel photograph would be carried
 * around dozens of times. 1400 px on the longest edge prints at ~120 dpi across
 * an A4, which is more than a watermark ever needs.
 *
 * Rejects anything that is not an image, and keeps PNG for pictures with an
 * alpha channel (a logo on transparent) — re-encoding those as JPEG would paint
 * the transparency black.
 */
export declare function readImage(file: File): Promise<string>;
