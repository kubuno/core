export interface FontMeta {
    family: string;
    subfamily: string;
    weight: number;
    style: 'normal' | 'italic';
}
export declare function parseFontMeta(buf: ArrayBuffer): FontMeta | null;
export declare function dedupeFontFamilies(list: readonly string[]): string[];
