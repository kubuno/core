import React from 'react';
/** What a `PaintBox` gives its painter: a 2D context already scaled to CSS pixels, the size, the pixel ratio. */
export interface PaintArgs {
    readonly ctx: CanvasRenderingContext2D;
    /** CSS pixels. */
    readonly width: number;
    readonly height: number;
    /** Device pixels per CSS pixel (the backing store is `width × dpr`). */
    readonly dpr: number;
    /** The `data` the box was given (`PaintData`), for the painter to draw. */
    readonly data?: unknown;
}
export interface PaintBoxProps {
    /** Draws the surface. Called on mount, on every resize or pixel-ratio change, and when `data` changes. */
    onPaint?: (e: PaintArgs) => void;
    /** What the drawing depends on: a new value repaints. */
    data?: unknown;
    className?: string;
    style?: React.CSSProperties;
    /** The drawing's text alternative; empty = decorative. */
    'aria-label'?: string;
}
/** Sizes a canvas's backing store for its CSS box and DPR, and returns the painter's arguments (`null` when not drawable). */
export declare function preparePaint(canvas: HTMLCanvasElement, dpr: number, data?: unknown): PaintArgs | null;
/**
 * A drawing surface (the `.kbview` `PaintBox`): a `<canvas>` whose `OnPaint` handler draws with the 2D context,
 * in CSS pixels at any pixel ratio — charts, previews, small custom visuals. Repainted when it is resized, when the
 * pixel ratio changes (zoom, another screen) and when `PaintData` changes.
 */
export declare const PaintBox: React.ForwardRefExoticComponent<PaintBoxProps & React.RefAttributes<HTMLCanvasElement>>;
