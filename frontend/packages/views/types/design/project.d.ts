import { type DesignSurface, type ProjectInfo } from './surface';
/** The route of the design page on a dev server. */
export declare const DESIGN_PATH = "/__kubuno_design__/";
/** `GET /__kubuno_design__/project.json`. */
export declare function loadDesignProject(): Promise<ProjectInfo>;
export interface ProjectDesignOptions {
    /** `@kubuno/host-runtime`'s version when the page is that package's build, else null. */
    readonly hostRuntime: string | null;
    /** The URL of the compiler's WebAssembly. */
    readonly wasmUrl: string;
    /** Imports a project module through the dev server (`/src/x`). */
    readonly importModule: (specifier: string) => Promise<Record<string, unknown>>;
}
/** Starts the surface in project mode. */
export declare function startProjectSurface(options: ProjectDesignOptions): DesignSurface;
