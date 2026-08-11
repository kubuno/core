import type { Privilege, Role, RoleAssignment } from '../../authz/types';
export declare const ROLES_KEY: string[];
export declare const PRIVILEGES_KEY: string[];
export declare const ASSIGNMENTS_KEY: string[];
/** Message the server actually sent, or a caller-supplied fallback. */
export declare function errorMessage(err: unknown, fallback: string): string;
export declare function usePrivilegeCatalogue(enabled?: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<Privilege[]>, Error>;
export declare function useRoles(enabled?: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<Role[]>, Error>;
export declare function useAssignments(params?: {
    role_id?: string;
    user_id?: string;
}, enabled?: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<RoleAssignment[]>, Error>;
export interface RolePayload {
    slug?: string;
    name: string;
    description?: string | null;
    privileges: string[];
}
/**
 * A role update. Every field is optional and an absent one means "leave it
 * alone" server-side — which is what lets the editor send only what the operator
 * actually changed, rather than echoing a translated label back into the row.
 * `privileges` must be absent for a system role: the server refuses the field on
 * one, even carrying an identical set.
 */
export type RoleUpdatePayload = Partial<Omit<RolePayload, 'slug'>>;
export declare function useCreateRole(onDone?: () => void): import("@tanstack/react-query").UseMutationResult<any, Error, RolePayload, unknown>;
export declare function useUpdateRole(id: string, onDone?: () => void): import("@tanstack/react-query").UseMutationResult<any, Error, Partial<Omit<RolePayload, "slug">>, unknown>;
export declare function useDeleteRole(onDone?: () => void): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export interface AssignmentPayload {
    role_id: string;
    user_id?: string;
    group_id?: string;
    scope: 'instance' | 'org_unit';
    org_unit_id?: string | null;
    expires_at?: string | null;
}
export declare function useCreateAssignment(onDone?: () => void): import("@tanstack/react-query").UseMutationResult<any, Error, AssignmentPayload, unknown>;
export declare function useDeleteAssignment(onDone?: () => void): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
