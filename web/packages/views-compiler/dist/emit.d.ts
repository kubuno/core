import { type SourceMapV3 } from './sourcemap.js';
import type { Plan } from './types.js';
/** Lower-case aliases of the Kubuno icon set (ICONS.md). */
export declare const ICON_ALIASES: Readonly<Record<string, string>>;
export interface EmitOptions {
    /** The view file relative to the project root, `/`-separated (= `plan.file`). */
    file: string;
    /** The view's text (embedded in the source map). */
    source: string;
    /** The view has no code-behind: export a default component. */
    defaultExport: boolean;
    /** Self-accept HMR updates (dev server). */
    hmr: boolean;
    /** The specifier of the views runtime (default `@kubuno/views`). */
    runtime?: string;
}
export interface EmitResult {
    code: string;
    map: SourceMapV3;
    /** Specifiers imported by the module (for tests and isolation checks). */
    imports: string[];
}
/** The import specifier of a plan module, as seen from the view's folder. */
export declare function specifierFor(module: string, viewFile: string): string;
/** Emits the module of a compiled view. */
export declare function emitViewModule(plan: Plan, options: EmitOptions): EmitResult;
/** Whether a specifier respects the module isolation rule (host singleton, Lucide, or project-local). */
export declare function isAllowedImport(spec: string): boolean;
