import { ViewProject } from './project.js';
import type { CheckSpan, HandlerUse } from './types.js';
interface CheckMapFile {
    view: string;
    class_name: string;
    spans: CheckSpan[];
    handlers: HandlerUse[];
}
/** Maps one generated check-file position back to the view. */
export declare function mapCheckPosition(spans: readonly CheckSpan[], line: number, column: number): [number, number] | null;
export interface RemapContext {
    root: string;
    cwd: string;
    /** Absolute check-file path → its map. */
    checks: Map<string, CheckMapFile>;
    /** Absolute code-behind path → the maps of its views. */
    codeBehinds: Map<string, CheckMapFile>;
}
/** Rewrites tsc output lines (exported for tests). */
export declare function remapTscOutput(output: string, ctx: RemapContext): string;
/** Loads the check maps written under `.kubuno/views` for the project's views. */
export declare function loadRemapContext(project: ViewProject, cwd: string): RemapContext;
export interface KbviewTscResult {
    exitCode: number;
    output: string;
}
/** Runs kbview-tsc in `cwd` with tsc arguments `args`; returns the exit code and the remapped output. */
export declare function runKbviewTsc(args: readonly string[], cwd?: string): Promise<KbviewTscResult>;
/** CLI entry (`bin/kbview-tsc.js`). */
export declare function main(argv?: readonly string[]): Promise<void>;
export {};
