import { type SourceFile } from 'ts-morph';
import { type MigrateConfig } from './migrate.js';
export interface SplitResult {
    /** The file split. */
    file: string;
    /** New files (path → text), one per component moved out. */
    created: Record<string, string>;
    /** Files changed (path → text): the file split, and the importers of the moved components. */
    edits: Record<string, string>;
    /** The file split, when nothing but imports is left in it. */
    deleted: string[];
    /** The components moved out, by new file. */
    moved: Array<{
        component: string;
        file: string;
    }>;
}
export declare function splitFile(cfg: MigrateConfig, sf: SourceFile): SplitResult | undefined;
