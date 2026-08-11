import type { Scope } from './types';
export interface Directory {
    units: {
        id: string;
        name: string;
        parent_id: string | null;
    }[];
    groups: {
        id: string;
        name: string;
        member_count: number;
    }[];
    users: {
        id: string;
        username: string;
        display_name: string | null;
        email: string;
        org_unit_id: string | null;
    }[];
    totalUsers: number;
    /** Fewer accounts were loaded than the instance holds. */
    partial: boolean;
    unitName: (id: string) => string | undefined;
    groupName: (id: string) => string | undefined;
    userName: (id: string) => string | undefined;
    /** Ancestor chain of a unit, itself first — mirrors `Subject::unit_chain`. */
    unitChain: (id: string | null) => string[];
    isLoading: boolean;
    /** The caller may not read the directory (403): names degrade to raw ids. */
    denied: boolean;
}
export declare function useDirectory(enabled?: boolean): Directory;
export interface ScopePreview {
    count: number;
    total: number;
    partial: boolean;
    everyone: boolean;
    available: boolean;
    isLoading: boolean;
}
/** "This rule will apply to N accounts", with its honesty attached. */
export declare function useScopePreview(scope: Scope, dir: Directory, enabled?: boolean): ScopePreview;
