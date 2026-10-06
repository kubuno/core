/** The package that provides the design page of module projects. */
export declare const HOST_RUNTIME_PACKAGE = "@kubuno/host-runtime";
/** Its manifest, relative to the package root. */
export declare const HOST_RUNTIME_MANIFEST = "dist/project/shared.json";
/** `@kubuno/host-runtime/dist/project/shared.json`. */
export interface HostRuntimeManifest {
    /** The manifest's format. */
    version: 1;
    /** The package's version. */
    hostRuntime: string;
    /** The project-mode design entry, relative to the package root. */
    entry: string;
    /** The Kubuno themes folder (`<id>/theme.json`), relative to the package root. */
    themes?: string;
    /** Shared specifier → its module, relative to the package root. */
    shared: Record<string, string>;
}
/** An installed host runtime, with absolute paths. */
export interface HostRuntime {
    /** The package root. */
    dir: string;
    version: string;
    /** The project-mode design entry. */
    entry: string;
    /** The themes folder, or null when the package ships none. */
    themes: string | null;
    /** Shared specifier → module file. */
    shared: ReadonlyMap<string, string>;
}
/** Reads and checks a manifest; throws with a readable message when it is not one. */
export declare function parseHostRuntimeManifest(dir: string, text: string): HostRuntime;
/**
 * The host runtime installed for the project at `root` (resolved like the project's own imports, from its
 * `package.json`), or null when the package is not installed. Throws when it is installed but its manifest is
 * missing or malformed (a package from before project mode, or a broken install).
 */
export declare function findHostRuntime(root: string): HostRuntime | null;
/** Whether a project's design page is the host runtime's (no `design.entry` of its own). */
export declare function usesHostRuntime(design: {
    entry?: string;
} | undefined): boolean;
/** The id prefix of the CommonJS facade of a shared specifier in pre-bundled dependencies. */
export declare const CJS_FACADE_PREFIX = "\0kubuno-shared-cjs:";
/** What `prebundleExternals` returns: a Rolldown plugin, structurally (no dependency on Rolldown's types). */
export interface PrebundlePlugin {
    name: string;
    resolveId(id: string, importer: string | undefined, options: {
        kind?: string;
    }): {
        id: string;
        external?: boolean;
    } | null;
    load(id: string): string | null;
}
/**
 * The plugin given to Vite's dependency pre-bundling (`optimizeDeps.rolldownOptions.plugins`): a pre-bundled
 * dependency (`lucide-react`, `@react-three/fiber`, …) keeps every shared specifier as an import, which the dev server
 * then resolves to the host runtime's module like the project's own imports, instead of bundling a copy (a second
 * React). Only the exact specifiers are kept out: `zustand/traditional` or `react-dom/server` are not shared, and are
 * bundled as usual (`optimizeDeps.exclude` would also drop their subpaths from pre-bundling and serve CommonJS files
 * as they are). A `require()` of a shared specifier (CommonJS code) gets an ES facade, as Vite does for its excluded
 * dependencies.
 */
export declare function prebundleExternals(rt: HostRuntime): PrebundlePlugin;
/**
 * The resolution of a specifier through the host runtime in the dev server: its shared module's file (and the
 * package's `/entry`), or null when it is not one of them. While Vite scans the project for dependencies to
 * pre-bundle (`scan`), a shared specifier is reported as external, so that it is never pre-bundled.
 */
export declare function resolveShared(rt: HostRuntime, id: string, scan?: boolean): string | {
    id: string;
    external: true;
} | null;
/**
 * Removes the shared specifiers from an `optimizeDeps.include` list, in place (`@vitejs/plugin-react` adds `react`,
 * `react-dom` and the JSX runtimes there; pre-bundled, they would be copies of the host runtime's). Returns how many
 * entries were removed.
 */
export declare function dropShared(include: string[] | undefined, rt: HostRuntime): number;
/**
 * The dev-server URL of a file: root-relative inside the project (`/node_modules/…`, as Vite writes the imports it
 * resolves there), `/@fs/<absolute path>` outside it (`/@fs/C:/…` on Windows).
 */
export declare function devServerUrl(root: string, file: string): string;
