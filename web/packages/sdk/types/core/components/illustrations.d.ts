/**
 * Kubuno's own illustration set — the pictures offered as a profile photo when
 * someone would rather not upload one.
 *
 * They are COMPOSED here rather than shipped as image files: a handful of
 * recipes crossed with a handful of palettes gives a whole gallery for a couple
 * of kilobytes of code, works offline, needs no CDN and no licence to honour.
 * Every one is a square SVG meant to be seen inside a circle, so the subject
 * stays well within the middle and the corners only ever carry background.
 */
export interface Palette {
    /** Background wash, from top-left to bottom-right. */
    bg: [string, string];
    /** Main subject. */
    ink: string;
    /** Secondary accent. */
    accent: string;
}
export declare const PALETTES: ReadonlyArray<{
    id: string;
    palette: Palette;
}>;
/** A drawing recipe: given a palette, it returns the SVG body (viewBox 0 0 96 96). */
interface Recipe {
    id: string;
    /** Collection the picture belongs to, used to group the gallery. */
    collection: 'abstrait' | 'nature' | 'cosmos' | 'motifs';
    /** Words the search box matches on, beyond the collection and palette names. */
    keywords: string[];
    draw: (p: Palette) => string;
}
export interface Illustration {
    /** `<recipe>-<palette>`, stable — it is the file name once picked. */
    id: string;
    collection: Recipe['collection'];
    keywords: string[];
    svg: string;
}
/** The whole gallery: every recipe in every palette. */
export declare const ILLUSTRATIONS: Illustration[];
export declare const COLLECTIONS: ReadonlyArray<{
    id: Recipe['collection'];
    label: string;
}>;
/** Inline `src` for an <img>, without a network round-trip. */
export declare function illustrationSrc(svg: string): string;
/** The picked illustration as a real file, ready to upload. */
export declare function illustrationFile(ill: Illustration): File;
export {};
