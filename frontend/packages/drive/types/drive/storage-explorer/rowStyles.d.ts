/**
 * Row accents of the list/details views, drawn entirely with inset box-shadows
 * so a contiguous run of selected rows reads as ONE frame (no internal lines,
 * no layout shift).
 */
import type React from 'react';
/** Per-state row accent, drawn entirely with inset box-shadow (no border, so no
 *  layout shift and no border+shadow doubling). */
export declare function rowAccentShadow(s: {
    selected?: boolean;
    preSelected?: boolean;
    focused?: boolean;
    dragTarget?: boolean;
    mergeTop?: boolean;
    mergeBottom?: boolean;
}): string | undefined;
/** Merge the pending-state style with a row accent box-shadow (kept if both). */
export declare function withRowShadow(base: React.CSSProperties | undefined, shadow?: string): React.CSSProperties | undefined;
