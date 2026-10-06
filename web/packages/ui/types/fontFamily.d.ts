export interface FontMeta {
    family: string;
    subfamily: string;
    weight: number;
    style: 'normal' | 'italic';
}
/**
 * Lit la famille/sous-famille d'une police depuis ses octets (TTF/OTF/TTC non
 * compressés). Renvoie `null` si illisible (ex. WOFF/WOFF2 compressés) → l'appelant
 * retombe sur le nom de fichier.
 */
export declare function parseFontMeta(buf: ArrayBuffer): FontMeta | null;
/**
 * Dédoublonne/normalise une liste de familles (filet de sécurité côté UI au cas où
 * une source fournirait encore des noms de fichiers) : suppression des doublons
 * insensible à la casse, tri alphabétique stable, libellés conservés tels quels.
 */
export declare function dedupeFontFamilies(list: readonly string[]): string[];
