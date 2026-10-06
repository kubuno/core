import type { ViteDevServer } from 'vite';
import { type HostRuntime } from './host-runtime.js';
import { type ViewProject } from './project.js';
/** The route of the design page (with its trailing slash: the page's relative URLs resolve under it). */
export declare const DESIGN_PATH = "/__kubuno_design__/";
/** The design entry of a project that names none (a module: the host runtime package's page). */
export declare const DEFAULT_DESIGN_ENTRY = "@kubuno/host-runtime/entry";
/** Where the running server is announced, under the project root (git-ignored). */
export declare const DESIGN_SERVER_FILE = ".kubuno/design-server.json";
/** `kubuno.views.json` → `design`. */
export interface DesignConfig {
    /** The page's entry module: a project-root-relative file, or a bare specifier. */
    entry?: string;
    /** A folder of Kubuno themes (`<id>/theme.json`), relative to the project root. */
    themes?: string;
    /**
     * Project modules the page imports, in order, before it renders a view: what the project's own entry would load
     * in the host (its stylesheet, its translations). Project-root-relative files (`src/index.css`), or bare
     * specifiers.
     */
    setup?: string[];
}
/** `.kubuno/design-server.json`. */
export interface DesignServerInfo {
    version: 1;
    urls: string[];
    designPath: string;
    pid: number;
    root: string;
}
/** What `GET /__kubuno_design__/project.json` returns. */
export interface DesignProjectInfo {
    root: string;
    hostRegistry: string;
    registries: {
        path: string;
        text: string;
    }[];
    userControls: {
        name: string;
        module: string;
    }[];
    viewsAbi: number;
    compiler: string;
    themes: string[];
    /** `design.setup` as dev-server URLs (`/src/index.css`, `/@id/pkg`). */
    setup: string[];
}
/** The URL the page's `<script type="module">` loads for a design entry. */
export declare function designEntryUrl(entry: string | undefined): string;
/**
 * The dev-server URLs of `design.setup`: a file that exists under the project root → its root-relative URL
 * (`src/index.css` → `/src/index.css`); anything else is taken for a bare specifier (`/@id/<spec>`). Entries that are
 * not strings, empty, or that leave the project root are skipped.
 */
export declare function designSetupUrls(root: string, setup: unknown): string[];
/** The design page's HTML, before `transformIndexHtml`. */
export declare function designPageHtml(entryUrl: string): string;
/** The ids of the themes of a themes folder (sub-folders holding a `theme.json`), sorted. */
export declare function themeIds(dir: string | null): string[];
/** The project description the design page loads (registries as `ViewProject` loads them). */
export declare function designProjectInfo(project: ViewProject, themesDir: string | null, setup?: string[]): DesignProjectInfo;
/**
 * The URL of the page's entry module: the project's `design.entry`, else the host runtime's project-mode entry at
 * its own dev-server URL (so that the URLs it computes from `import.meta.url` resolve), else the default specifier
 * (which fails to load: the server warned that `@kubuno/host-runtime` is missing).
 */
export declare function designPageEntryUrl(root: string, design: DesignConfig, hostRuntime: HostRuntime | null): string;
/** The themes folder the route serves: `design.themes`, else the host runtime's for a project using its page. */
export declare function designThemesDir(root: string, design: DesignConfig, hostRuntime: HostRuntime | null): string | null;
/**
 * The file of a themes folder a request names, or `null` when it is not one the route serves (outside the folder,
 * not `.json` / `.css`, missing).
 */
export declare function themeFile(dir: string, requestPath: string): string | null;
/** Writes the announcement file (and its folder). */
export declare function writeDesignServerInfo(root: string, urls: readonly string[]): string;
/** Removes the announcement file when this process wrote it. */
export declare function removeDesignServerInfo(root: string): void;
/** Installs the route on a dev server, and the announcement file while it listens. */
export declare function installDesignServer(server: ViteDevServer, project: ViewProject, hostRuntime?: HostRuntime | null): void;
