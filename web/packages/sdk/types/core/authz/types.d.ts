/** One row of the privilege catalogue (`GET /admin/privileges`). */
export interface Privilege {
    key: string;
    namespace: string;
    domain: string;
    verb: string;
    label: string;
    description: string | null;
    /** Can this privilege be confined to an organisational subtree? */
    is_ou_scopable: boolean;
    /** The declaring module is gone. Kept and flagged, never hidden. */
    is_orphan: boolean;
}
/** One role, as `GET /admin/roles` returns it (definition + derived facts). */
export interface Role {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    is_system: boolean;
    is_superuser: boolean;
    privileges: string[];
    assignment_count: number;
    /**
     * False when the role holds at least one non-scopable privilege (or is a
     * superuser role): an org-unit-scoped assignment of it would be refused, so
     * the console disables that option instead of letting the operator discover
     * it on a 422.
     */
    ou_delegable: boolean;
    created_at: string;
    updated_at: string;
}
export type AssignmentScope = 'instance' | 'org_unit';
/** One row of `GET /admin/role-assignments`, joined with its labels. */
export interface RoleAssignment {
    id: string;
    role_id: string;
    role_slug: string;
    role_name: string;
    subject_user_id: string | null;
    subject_group_id: string | null;
    subject_label: string | null;
    scope: AssignmentScope;
    scope_org_unit_id: string | null;
    scope_org_unit_name: string | null;
    expires_at: string | null;
    created_at: string;
    created_by: string | null;
}
/** One privilege and the scope it is held over — scopes already resolved. */
export interface EffectivePrivilege {
    key: string;
    instance: boolean;
    /** Organisational units, subtrees already expanded server-side. */
    org_units: string[];
}
/**
 * What an account effectively holds.
 *
 * Returned by `GET /api/v1/me` (the `privileges` block — the caller looking at
 * themselves, no privilege required) and by `GET /admin/users/:id/privileges`
 * (an operator looking at someone else). Same shape from both, deliberately.
 */
export interface EffectivePrivileges {
    user_id: string;
    is_superuser: boolean;
    /** May enter the administration surface at all. */
    is_admin: boolean;
    org_unit_id: string | null;
    privileges: EffectivePrivilege[];
    /**
     * Keys this credential may never exercise, whatever the rest says. Non-empty
     * only for an API token: a legacy one keeps its owner's super-user flag while
     * it may still read, and this list is the only thing that says "not that one".
     */
    denied: string[];
}
/**
 * The single privilege predicate used everywhere in the console.
 *
 * `can(key)` answers "does the caller hold this anywhere?" — the question the
 * navigation asks. `can(key, unitId)` narrows it to one organisational unit,
 * and `can(key, null)` to a target that sits in no unit (covered by instance
 * scope only, exactly like `AdminContext::has_for_unit` server-side).
 */
export type CanFn = (key: string, unit?: string | null) => boolean;
/** Privilege keys the console checks by name (mirrors `authz::keys`). */
export declare const PRIV: {
    readonly USERS_READ: "core.users.read";
    readonly USERS_CREATE: "core.users.create";
    readonly USERS_UPDATE: "core.users.update";
    readonly USERS_DELETE: "core.users.delete";
    /** Resetting someone else's password — its own key, not `users.update`. */
    readonly USER_PASSWORD: "core.user_password.execute";
    readonly SESSIONS_READ: "core.sessions.read";
    /**
     * Revoking sessions — and, in the device inventory, every mutation that ends
     * in revoking them: blocking, signing out, forgetting an entry.
     */
    readonly SESSIONS_DELETE: "core.sessions.delete";
    readonly ORG_UNITS_READ: "core.org_units.read";
    readonly ORG_UNITS_MANAGE: "core.org_units.manage";
    readonly GROUPS_READ: "core.groups.read";
    readonly GROUPS_MANAGE: "core.groups.manage";
    readonly ROLES_READ: "core.roles.read";
    readonly ROLES_MANAGE: "core.roles.manage";
    readonly SETTINGS_READ: "core.settings.read";
    readonly SETTINGS_MANAGE: "core.settings.manage";
    readonly STATS_READ: "core.stats.read";
    readonly MODULES_READ: "core.modules.read";
    readonly MODULES_MANAGE: "core.modules.manage";
    readonly MARKETPLACE_MANAGE: "core.marketplace.manage";
    readonly AUTH_PROVIDERS_READ: "core.auth_providers.read";
    readonly AUTH_PROVIDERS_MANAGE: "core.auth_providers.manage";
    readonly THEMES_READ: "core.themes.read";
    readonly THEMES_MANAGE: "core.themes.manage";
    readonly MAIL_READ: "core.mail.read";
    readonly MAIL_MANAGE: "core.mail.manage";
    readonly AUDIT_READ: "core.audit.read";
    /**
     * Opening the storage page. Its own key rather than `stats.read`: the page
     * names accounts and how much each one holds. There is no `storage.manage`
     * counterpart — the page writes through `users.update` (one account's quota)
     * and `settings.manage` (the default policy).
     */
    readonly STORAGE_READ: "core.storage.read";
    readonly BACKUP_READ: "core.backup.read";
    readonly BACKUP_MANAGE: "core.backup.manage";
    /** Opening the alert centre. */
    readonly ALERTS_READ: "core.alerts.read";
    /** Taking, assigning, closing or ignoring an alert, and running its actions. */
    readonly ALERTS_MANAGE: "core.alerts.manage";
    /** Reading the administration rules, their catalogue and their run log. */
    readonly RULES_READ: "core.rules.read";
    /**
     * Writing an administration rule.
     *
     * Held apart from every other administrative key, and by no seeded role: a
     * rule can suspend accounts and revoke sessions, at machine speed, over a
     * population its author describes rather than names. "Can administer" must
     * not imply "can arm that".
     */
    readonly RULES_MANAGE: "core.rules.manage";
};
