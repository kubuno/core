import type { ActiveScope, ResolvedSetting } from '../../settings/scopeTypes';
/**
 * The four verbs of a scoped setting, for one scope: read, write, revert, lock.
 *
 * Deliberately the *same* endpoints and the *same* query key as
 * `settings/SettingsGroupPanel`. Two consequences, both wanted:
 *
 *   • the payload this page needs is usually already in the cache, and a write
 *     here refreshes the generic settings page and vice versa — the two can
 *     never show contradictory values for the same key;
 *   • provenance, locking and reverting behave identically to every other
 *     settings screen, because they *are* the same calls. A bespoke write path
 *     would be the place where "revert" quietly turned into "store the
 *     inherited value", which is the one thing the model forbids.
 */
export declare function useDirectoryPolicy(scope: ActiveScope): {
    /** `undefined` while loading, and for a key this instance has not declared. */
    setting: (key: string) => ResolvedSetting | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<ResolvedSetting[]>, Error>>;
    error: string | null;
    clearError: () => void;
    write: (key: string, value: unknown) => void;
    revert: (key: string) => void;
    lock: (key: string, locked: boolean) => void;
};
export type DirectoryPolicy = ReturnType<typeof useDirectoryPolicy>;
