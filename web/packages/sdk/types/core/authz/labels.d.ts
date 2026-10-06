import type { Role } from './types';
export declare const privilegeLabelKey: (key: string) => string;
export declare const privilegeDescKey: (key: string) => string;
export declare const roleNameKey: (slug: string) => string;
export declare const roleDescKey: (slug: string) => string;
/** Functional group heading. Domains carry neither dot nor dash. */
export declare const domainKey: (domain: string) => string;
/** Anything carrying a catalogue key and its stored wording. */
export interface KeyedEntry {
    key: string;
    label: string;
    description?: string | null;
}
export interface AuthzLabels {
    /** Privilege (or API-token scope) title. Never empty: falls back to the key. */
    privilegeLabel: (entry: KeyedEntry) => string;
    privilegeDescription: (entry: KeyedEntry) => string | null;
    /** System-role name; a custom role is always shown as its author wrote it. */
    roleName: (role: Role) => string;
    roleDescription: (role: Role) => string | null;
    /** Functional group heading, or the raw segment for a module domain. */
    domainLabel: (domain: string) => string;
}
export declare function useAuthzLabels(): AuthzLabels;
