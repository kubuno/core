import { ViewCompiler } from './compiler.js';
import type { CompileOutput, UserControlRef } from './types.js';
/** View file extensions (VIEWS-SPEC §1.1). */
export declare const VIEW_EXTENSIONS: readonly [".kbview", ".kbcontrol"];
/** Where generated declarations and check files go, under the project root (git-ignored). */
export declare const GENERATED_DIR = ".kubuno/views";
export declare function isViewFile(file: string): boolean;
/** `a\b` → `a/b`. */
export declare function toPosix(p: string): string;
/** The project-root-relative, `/`-separated path of `file`. */
export declare function projectPath(root: string, file: string): string;
/** The same-stem code-behind of a view (`X.ts`, else `X.tsx`), if any. */
export declare function codeBehindOf(viewFile: string): string | null;
/** The view a code-behind belongs to (`X.ts` → `X.kbview` / `X.kbcontrol`), if any. */
export declare function viewOfCodeBehind(file: string): string | null;
/** The stem of a view file (`NotesSettingsPage`). */
export declare function viewStem(file: string): string;
/** Every view under `dirs` (relative to `root`), sorted. */
export declare function scanViews(root: string, dirs?: readonly string[]): string[];
/** The user controls of the project: one per `.kbcontrol`, rendered by its code-behind (else itself). */
export declare function userControlsOf(root: string, views: readonly string[]): UserControlRef[];
/** The generated files of a view. */
export declare function generatedPaths(root: string, viewFile: string): {
    dts: string;
    check: string;
    map: string;
};
/** Writes `text` unless the file already holds it (keeps tsc's incremental state and watchers quiet). */
export declare function writeIfChanged(file: string, text: string): boolean;
/** Writes the declarations and the check file (+ its span map) of one compiled view. */
export declare function writeGenerated(root: string, viewFile: string, out: CompileOutput): void;
/** `kubuno.views.json` (VIEWS-SPEC §1): target, extra registries, view folders, `Class` budget. */
export interface ProjectConfig {
    target?: 'web' | 'desktop';
    /** Project registries (custom controls), relative to the project root. */
    registries?: string[];
    /** Folders scanned for views (default `["src"]`). */
    sources?: string[];
    classBudget?: number;
    /** The host registry file (default: `@kubuno/ui/kbview-registry.web.json` from node_modules). */
    hostRegistry?: string;
}
export declare function readProjectConfig(root: string): ProjectConfig;
/** The host registry: `node_modules/@kubuno/ui/kbview-registry.web.json`, searched upwards from `root`. */
export declare function findHostRegistry(root: string): string | null;
/**
 * A project registry with its project-local modules rewritten to project-root-relative specifiers
 * (`./controls` next to `src/kbview-controls.json` → `/src/controls`), what the compiler expects.
 */
export declare function projectRegistryJson(root: string, file: string): string;
/** The `.wasm` shipped in the package (`wasm/kubuno-views-web.wasm`, next to `src/` and `dist/`). */
export declare function wasmPath(): string;
/** A compiler instance over the shipped `.wasm` (compiled once per process). */
export declare function loadNodeCompiler(): Promise<ViewCompiler>;
export interface ProjectOptions {
    /** Host registry file; default: from `kubuno.views.json`, else `@kubuno/ui` in node_modules. */
    hostRegistry?: string;
    /** Extra project registries (relative to the root). */
    registries?: string[];
    /** Folders scanned for views. */
    sources?: string[];
}
/** A project: its root, its views, and a compiler loaded with its registries and user controls. */
export declare class ViewProject {
    readonly root: string;
    readonly compiler: ViewCompiler;
    views: string[];
    readonly hostRegistry: string;
    readonly sources: string[];
    private constructor();
    static open(root: string, options?: ProjectOptions): Promise<ViewProject>;
    /** Re-lists the views and the user controls. */
    rescan(): void;
    /** Compiles one view file (read from disk unless `source` is given). */
    compile(viewFile: string, source?: string, design?: boolean): CompileOutput;
    /** Compiles every view and writes its generated files; returns the outputs by file. */
    generateAll(): Map<string, CompileOutput>;
}
