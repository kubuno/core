export declare const AUDIENCES_KEY: readonly ["admin-audiences"];
export declare const audienceKey: (id: string) => readonly ["admin-audience", string];
export declare const policyKey: (unit: string, module: string) => readonly ["admin-audience-policy", string, string];
/** One row of the list. */
export interface Audience {
    id: string;
    name: string;
    description: string | null;
    /** The seeded "everyone" audience: no explicit members, never deletable. */
    is_everyone: boolean;
    /** Entries added by hand — what the sheet edits. */
    member_count: number;
    /**
     * Distinct **active accounts** those entries resolve to. Differs from
     * `member_count` as soon as a member is a group, which is the recommended
     * case — so this is the figure that says how wide a proposal really is.
     */
    reach: number;
    /** How many (unit × module) pairs offer this audience. */
    applied_to: number;
    created_at: string;
    updated_at: string;
}
export interface AudienceMember {
    member_type: 'user' | 'group';
    member_id: string;
    label: string;
    email: string | null;
    /** Active accounts the group brings in. Null for an individual account. */
    group_reach: number | null;
    /** The referenced account or group is gone. Should never happen; shown if it does. */
    is_dangling: boolean;
    added_at: string;
}
export interface AppliedAt {
    module_id: string;
    org_unit_id: string;
    org_unit_name: string;
    position: number;
}
export interface AudienceSheet {
    audience: Audience;
    members: AudienceMember[];
    applied: AppliedAt[];
}
export declare function useAudiences(): import("@tanstack/react-query").UseQueryResult<NoInfer<{
    audiences: Audience[];
    max_applied: number;
}>, Error>;
export declare function useAudience(id: string | null): import("@tanstack/react-query").UseQueryResult<NoInfer<AudienceSheet>, Error>;
/**
 * Every mutation of the section, sharing one invalidation.
 *
 * They are grouped rather than exported one by one so that no caller can add a
 * write that forgets to refresh the list: the counts shown there are derived
 * from what these calls change.
 */
export declare function useAudienceMutations(openId: string | null): {
    create: import("@tanstack/react-query").UseMutationResult<{
        audience: Audience;
    }, Error, {
        name: string;
        description?: string | null;
    }, unknown>;
    update: import("@tanstack/react-query").UseMutationResult<any, Error, {
        id: string;
        name: string;
        description?: string | null;
    }, unknown>;
    remove: import("@tanstack/react-query").UseMutationResult<{
        was_applied_to: number;
    }, Error, string, unknown>;
    addMembers: import("@tanstack/react-query").UseMutationResult<any, Error, {
        id: string;
        members: {
            member_type: string;
            member_id: string;
        }[];
    }, unknown>;
    removeMembers: import("@tanstack/react-query").UseMutationResult<any, Error, {
        id: string;
        members: {
            member_type: string;
            member_id: string;
        }[];
    }, unknown>;
};
export interface PolicyEntry {
    audience_id: string;
    position: number;
    name: string;
    description: string | null;
    is_everyone: boolean;
}
/**
 * What a unit offers in a module.
 *
 * `applied` is what was written **on this unit** — what the form edits and what
 * a save replaces. `effective` is what is actually in force, which for a unit
 * with no rows of its own is inherited from the nearest ancestor that has some;
 * `inherited_from` then names that ancestor. The two are identical, and
 * `inherited_from` null, whenever the unit has its own policy.
 *
 * The same distinction the settings pages already draw between "inherited from
 * X" and "overridden here" — one tree must not carry two inheritance stories.
 */
export interface PolicyView {
    applied: PolicyEntry[];
    effective: PolicyEntry[];
    inherited_from: {
        org_unit_id: string;
        org_unit_name: string;
    } | null;
    max_applied: number;
}
export declare function useAudiencePolicy(orgUnitId: string | null, moduleId: string | null): import("@tanstack/react-query").UseQueryResult<NoInfer<PolicyView>, Error>;
export declare function useSetPolicy(): import("@tanstack/react-query").UseMutationResult<any, Error, {
    org_unit_id: string;
    module_id: string;
    audience_ids: string[];
}, unknown>;
