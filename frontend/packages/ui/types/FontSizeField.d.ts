import React from 'react';
export interface FontSizeFieldProps {
    /** Current font family — empty string renders blank (mixed/undetermined selection). */
    font: string;
    onFontChange: (font: string) => void;
    fonts: readonly string[];
    recentFonts?: readonly string[];
    /** Current font size as a string — empty string renders blank (mixed selection). */
    size: string;
    onSizeChange: (size: string) => void;
    /** Preset sizes offered in the size dropdown. */
    sizes: readonly (number | string)[];
    /** Min/max accepted when typing a custom size. */
    minSize?: number;
    maxSize?: number;
    /** Shared height of both selectors (px). */
    height?: number;
    fontWidth?: number;
    sizeWidth?: number;
    fontSize?: number;
    disabled?: boolean;
    className?: string;
    /** Colour scheme — `dark` for dark toolbars/panels. */
    theme?: 'light' | 'dark';
}
/**
 * Unified font-family + font-size selector (`@ui`). The two selectors share a
 * single height and are glued horizontally: the joined edge is squared (only the
 * outer corners stay rounded) and the middle borders overlap into one divider
 * line. The font side groups by category with previews; the size side is an
 * editable combobox (type any value or pick a preset). Both accept an empty
 * value to render blank on a mixed selection (Word).
 */
export declare function FontSizeField({ font, onFontChange, fonts, recentFonts, size, onSizeChange, sizes, minSize, maxSize, height, fontWidth, sizeWidth, fontSize, disabled, className, theme, }: FontSizeFieldProps): React.JSX.Element;
