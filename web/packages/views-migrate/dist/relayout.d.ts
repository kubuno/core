import { type Classified, type Move } from './layout.js';
export interface RelayoutOptions {
    /** The project root (the folder of `kubuno.views.json`). */
    root: string;
    /** App roots, relative to `root` (default `src`). */
    appRoots?: string[];
    /** Folders left as they are, relative to `root`. */
    exclude?: string[];
    /** A folder holding more than this many views is split by role (default 12). */
    split?: number;
    /** Also place the React components (`X.tsx`) by their role. */
    components?: boolean;
    /** Only these units (by their module or view path); default: all. */
    only?: (u: Classified) => boolean;
    /** Units placed by hand (`src/FontsExplorer.tsx` → `src/fonts`): the unit's view or module → its folder, relative to `root`. */
    place?: Array<{
        unit: string;
        dir: string;
    }>;
    /** Units renamed (`src/drive-app/EmptyState.kbview` → `DriveEmptyState`): their files and their class. */
    rename?: Array<{
        unit: string;
        stem: string;
    }>;
    /** Moves added by hand (a store to `model/`, an API client to `services/`), relative to `root`. */
    extraMoves?: Array<{
        from: string;
        to: string;
    }>;
}
export interface RelayoutPlan {
    units: Classified[];
    moves: Move[];
    /** Path → new text (moved files at their new path, edited files in place, converted views). */
    writes: Map<string, string>;
    /** Files outside the code that name a moved file (to check by hand). */
    warnings: string[];
}
/** Computes the relayout of a project (nothing written). */
export declare function planRelayout(opts: RelayoutOptions): RelayoutPlan;
/** Writes a plan: `git mv` (or a rename) for every move, then the new texts. */
export declare function applyRelayout(root: string, plan: RelayoutPlan): void;
/** The report of a plan: one line per unit (role, kind, why, where to). */
export declare function relayoutReport(root: string, plan: RelayoutPlan): {
    lines: string[];
    json: unknown;
};
