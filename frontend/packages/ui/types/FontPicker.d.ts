import React from 'react';
export interface FontPickerProps {
    value: string;
    onChange: (font: string) => void;
    /** Familles de polices proposées (dédoublonnées et triées par le composant). */
    fonts: readonly string[];
    /** Polices récemment utilisées, épinglées en tête (optionnel). */
    recent?: readonly string[];
    width?: number | string;
    height?: number;
    fontSize?: number;
    disabled?: boolean;
    className?: string;
    variant?: 'default' | 'ghost';
    /** Text shown (greyed) when `value` is empty — e.g. a mixed-font selection. */
    placeholder?: string;
    /** Extra styles merged into the trigger button (e.g. to square joined corners). */
    buttonStyle?: React.CSSProperties;
    /** Short glyph sample rendered in each font next to its name. '' hides it. */
    sampleText?: string;
    /** Colour scheme — `dark` for dark toolbars/panels. */
    theme?: 'light' | 'dark';
}
export interface UITheme {
    text: string;
    sec: string;
    ter: string;
    border: string;
    bg: string;
    hover: string;
    active: string;
    sel: string;
    accent: string;
}
export declare const FONT_UI_THEME: Record<'light' | 'dark', UITheme>;
/**
 * Sélecteur de police partagé (`@ui`). Chaque entrée est rendue dans SA police
 * (aperçu) et regroupée par catégorie (Sans Serif / Serif / Monospace / …), façon
 * Figma / Google Fonts. Recherche avec surbrillance, échantillon de glyphes, et
 * accessibilité complète (combobox / listbox / option). Dédoublonne la liste reçue
 * (cf. `dedupeFontFamilies`) — le regroupement des styles (Calibri Bold/Light…)
 * sous une seule famille se fait au CHARGEMENT des polices (cf. `parseFontMeta`).
 */
export declare function FontPicker({ value, onChange, fonts, recent, width, height, fontSize, disabled, className, variant, placeholder, buttonStyle, sampleText, theme, }: FontPickerProps): React.JSX.Element;
