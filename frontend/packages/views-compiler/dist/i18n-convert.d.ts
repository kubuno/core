import { type I18nBundle, type KbresCodec } from './kbres.js';
type TS = typeof import('typescript');
type Bundles = Record<string, Record<string, unknown>>;
/** `<dir>/<lang>/<ns>.json` for every language folder of `dir`. */
export declare function readJsonLocales(dir: string, ns: string): Bundles;
/** Loads TypeScript from `fromDir`'s project (the converter never bundles its own). */
export declare function loadTypeScript(fromDir: string): TS;
/** The dictionaries an `i18n.ts`-style module registers, by namespace (statically evaluated). */
export declare function readI18nModule(ts: TS, file: string): Array<{
    ns: string;
    bundles: Bundles;
}>;
/** Deep comparison that also requires the same key order (a converted set must be byte-for-byte the same JSON). */
export declare function sameBundles(a: unknown, b: unknown): boolean;
/** What `writeKbresSet` wrote. */
export interface ConvertedSet {
    neutral: string;
    files: string[];
}
/**
 * Writes the `.kbres` set of `bundles` at `outFile` (the neutral file; satellites `stem.<lang>.kbres` beside it),
 * then reads it back and throws unless every language gives the very same bundle (keys, values, order).
 */
export declare function writeKbresSet(codec: KbresCodec, bundles: Bundles, outFile: string, neutral: string): ConvertedSet;
/** Reads the set at `file` back and throws on the first language whose bundle differs from `bundles`. */
export declare function verifyKbresSet(codec: KbresCodec, bundles: Bundles, file: string): Record<string, I18nBundle>;
export {};
