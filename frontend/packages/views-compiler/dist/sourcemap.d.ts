/** A minimal source map v3 writer and reader (Base64 VLQ), for the generated view modules. */
/** One mapping: generated 0-based column → source 0-based line / column (single source). */
export interface Segment {
    col: number;
    srcLine: number;
    srcCol: number;
}
export interface SourceMapV3 {
    version: 3;
    file?: string;
    sources: string[];
    sourcesContent?: (string | null)[];
    names: string[];
    mappings: string;
}
/** Encodes per-line segment lists (all pointing into source 0). */
export declare function encodeMappings(lines: readonly (readonly Segment[])[]): string;
/** Decodes `mappings` back into per-line segments (tests, debugging). */
export declare function decodeMappings(mappings: string): Segment[][];
