/**
 * FolderGlyph — L'icône d'un dossier, centralisée pour TOUTES les vues :
 * grille (DriveApp/StorageExplorer), arbre latéral, menu « Aller à » du fil
 * d'ariane, modales Déplacer / Infos / sélecteur de dossier…
 *
 * Règle : un dossier protégé d'application affiche le logo de l'app À LA PLACE
 * de l'icône de dossier (une seule icône, jamais deux). Priorités :
 *   1. logo de marque du module (FaviconRegistry) si dossier protégé
 *   2. icône Lucide personnalisée du dossier (folder.icon) si elle résout
 *   3. icône Lucide déclarée par le module (sidebar_items) si dossier protégé
 *   4. dossier classique (folder.color, défaut gris)
 */
import React from 'react';
/** Champs minimaux pour décider de l'icône — sous-ensemble de `Folder`. */
export interface FolderGlyphSource {
    name: string;
    is_protected?: boolean;
    icon?: string | null;
    color?: string | null;
}
/** Carte nom-de-dossier-protégé → app (logo SVG de marque ou icône Lucide). */
export declare function useProtectedFolderApps(): Record<string, {
    logo?: string;
    icon?: string;
}>;
export declare function FolderGlyph({ folder, size, className, color, style }: {
    folder: FolderGlyphSource;
    size?: number;
    className?: string;
    /** Force la couleur (ex. bleu « actif » dans l'arbre) — sans effet sur un logo de marque. */
    color?: string;
    style?: React.CSSProperties;
}): React.JSX.Element;
