import type { CanFn } from './types';
/**
 * The caller's own effective privileges, and the single `can()` predicate the
 * whole console is derived from.
 *
 * ── Where the data comes from ────────────────────────────────────────────────
 * `GET /api/v1/me` carries a `privileges` block: the caller's effective
 * privileges with their scopes resolved, and the super-user flag. It is
 * information about oneself, so it demands no privilege — and it is narrowed to
 * what the *presented credential* may exercise, so an interface driven by a
 * scoped API token offers exactly the actions the server will accept.
 *
 * It used to be read from `GET /admin/users/:id/privileges` instead, which
 * requires `core.roles.read`. Two things followed, and both are gone: a
 * delegated administrator who did not also hold that key read back a 403 and was
 * shown no console at all, and every ordinary user provoked one failing request
 * per page load.
 *
 * ── What it costs ────────────────────────────────────────────────────────────
 * Nothing on a page load: `initialize()` already reads `/me` and keeps the block.
 * The store only issues a request on the paths that obtain a user without going
 * through it (signing in, the OAuth callback).
 */
export interface PrivilegeApi {
    /** Holds `key` anywhere (no unit), or over `unit` when one is given. */
    can: CanFn;
    /** Holds every privilege, present and future. */
    isSuperuser: boolean;
    /** May enter the administration surface at all (super-user or holds ≥ 1). */
    isAdmin: boolean;
    /** The caller's own organisational unit, when they sit in one. */
    orgUnitId: string | null;
    /** True while the resolution is still in flight (no verdict yet). */
    isLoading: boolean;
}
export declare function usePrivileges(): PrivilegeApi;
