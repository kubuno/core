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
}
/**
 * Sélecteur de police partagé (`@ui`). Chaque entrée est rendue dans SA police pour
 * servir d'aperçu. Dédoublonne la liste reçue (cf. `dedupeFontFamilies`) — le vrai
 * regroupement des styles (Calibri Bold/Light…) sous une seule famille se fait au
 * CHARGEMENT des polices via la table `name` (cf. `parseFontMeta`).
 */
export declare function FontPicker({ value, onChange, fonts, recent, width, height, fontSize, disabled, className, variant, }: FontPickerProps): React.JSX.Element;
