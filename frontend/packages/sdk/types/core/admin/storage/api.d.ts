/**
 * The storage page's data layer.
 *
 * Two reads and two writes, and the writes deliberately go through endpoints
 * that already existed: one account's quota is `PATCH /admin/users/:id` (the
 * audited path the directory uses), the default policy is the generic scoped
 * settings API. A storage-specific write endpoint would be a second place for
 * the audit entry to be forgotten.
 */
export declare const STORAGE_KEY: readonly ["admin-storage"];
export declare const CONSUMERS_KEY: readonly ["admin-storage-consumers"];
export declare const ACCOUNT_USAGE_KEY: readonly ["admin-storage-account-usage"];
/** The key the default-quota policy is stored under, at whatever scope. */
export declare const DEFAULT_QUOTA_KEY = "storage.default_quota_bytes";
export interface StorageVolume {
    path: string;
    total_bytes: number;
    available_bytes: number;
    used_bytes: number;
}
export interface UnitUsage {
    unit_id: string | null;
    unit_name: string | null;
    accounts: number;
    used_bytes: number;
    allocated_bytes: number;
}
export interface TrendPoint {
    day: string;
    used_bytes: number;
    allocated_bytes: number;
    accounts: number;
    over_quota: number;
}
/**
 * One line of a category breakdown, as declared by a module.
 *
 * `billable` and `held` are carried on every row so a reading never has to know
 * the vocabulary to be drawn correctly — but the **catalog** below is what makes
 * the rules true. Never hard-code the ten identifiers' meaning in the frontend:
 * a downgraded server may send a category this build has never heard of, and the
 * only correct answer is to show it with the rule the server states.
 */
export interface CategoryUsage {
    /** A vocabulary identifier — or an unknown one, on a newer server. */
    category: string;
    used_bytes: number;
    object_count: number | null;
    /** Counted against the account's quota. */
    billable: boolean;
    /** Physically occupies the volume. False only for `delegated`. */
    held: boolean;
    accounts: number | null;
}
/** The authority on what each category means. Order here is the display order. */
export interface CatalogEntry {
    id: string;
    billable: boolean;
    held: boolean;
}
/**
 * One module's line in the storage breakdown.
 *
 * `declared` is the field that matters, and the reason `used_bytes` is nullable
 * rather than defaulted to zero: a module that has never declared holds an
 * *unknown* amount, which is a different fact from holding nothing. Rendering
 * both as an empty bar is exactly the lie this feature exists to stop telling.
 */
export interface ModuleUsage {
    module_id: string;
    display_name: string;
    declared: boolean;
    /** `null` exactly when `declared` is false. Never coerce it to 0. */
    used_bytes: number | null;
    object_count: number | null;
    accounts: number | null;
    first_declared_at: string | null;
    last_declared_at: string | null;
    last_full_sync_at: string | null;
    /** Declared once, then went quiet past the configured window. */
    stale: boolean;
    is_enabled: boolean;
    /** Everything the module physically holds, billed or not. `null` if silent. */
    held_bytes: number | null;
    /** Bytes this module caused but another module stores. Never in any total. */
    delegated_bytes: number | null;
    delegated_objects: number | null;
    /** Empty when the module has never declared. */
    categories: CategoryUsage[];
}
export interface ModuleBreakdown {
    modules: ModuleUsage[];
    /** Sum of every declaration — the BILLED share, and only that. */
    declared_bytes: number;
    /** The authoritative total minus the declarations: the share nobody claimed. */
    unattributed_bytes: number;
    /** Declarations in excess of the authoritative total. Normally 0. */
    over_declared_bytes: number;
    silent_modules: number;
    stale_hours: number;
    /** Everything the modules occupy, billed or not — the disk-sizing figure. */
    held_bytes: number;
    /** Held by another module on a module's behalf. Outside every total. */
    delegated_bytes: number;
    delegated_objects: number;
    /** Instance-wide split by category. */
    categories: CategoryUsage[];
    catalog: CatalogEntry[];
}
/** An account the correction would push over its quota, so it was left alone. */
export interface HeldBackAccount {
    user_id: string;
    email: string;
    quota_bytes: number;
    counter_bytes: number;
    declared_bytes: number;
}
/**
 * Why the reconciliation is holding off.
 *
 * `no_declarant` is about the instance, not a module — `module_id` is empty for
 * it — and it is the one that matters most: an empty declaration table read as
 * "the modules charge nobody anything" would zero every quota counter on an
 * instance whose only fault is that the channel is not plugged in yet.
 */
export type ReconciliationBlocker = 'never_fully_synced' | 'stale' | 'no_declarant';
export interface ReconciliationBlock {
    /** Empty string for `no_declarant`. */
    module_id: string;
    blocker: ReconciliationBlocker;
}
/**
 * The state of the counter reconciliation — the hourly job that realigns each
 * account's quota counter on what the modules declare.
 *
 * `corrected_accounts` and `bytes_moved` are always 0 in this overview: the
 * overview measures, the job corrects. They are reported anyway so the card can
 * say so rather than leave the reader to guess why they never move.
 */
export interface Reconciliation {
    /** The `storage.usage_authoritative` setting. */
    enabled: boolean;
    /** What suspends the correction, and why. Empty when nothing does. */
    blocked_by: ReconciliationBlock[];
    min_delta_bytes: number;
    drifting_accounts: number;
    corrected_accounts: number;
    bytes_moved: number;
    held_back: HeldBackAccount[];
}
export interface UnitPolicy {
    unit_id: string | null;
    unit_name: string;
    bytes: number | null;
    locked: boolean;
    updated_at: string | null;
}
export interface StorageOverview {
    used_bytes: number;
    allocated_bytes: number;
    accounts: number;
    volume: StorageVolume | null;
    quota_states: {
        ok: number;
        near: number;
        full: number;
    };
    by_unit: UnitUsage[];
    by_module: ModuleBreakdown;
    trend: TrendPoint[];
    policy: {
        key: string;
        instance_bytes: number | null;
        instance_locked: boolean;
        units: UnitPolicy[];
    };
    reconciliation: Reconciliation;
    warn_percent: number;
    sampled_days: number;
}
/** One module's line on a single account's sheet. */
export interface AccountModuleUsage {
    module_id: string;
    display_name: string;
    /** Charged against this account's quota. */
    billable_bytes: number;
    /** Physically held for this account, charged or not. */
    held_bytes: number;
    delegated_bytes: number;
    delegated_objects: number;
    object_count: number;
    categories: CategoryUsage[];
    last_declared_at: string | null;
    stale: boolean;
}
/**
 * One account's storage sheet.
 *
 * Volumes, object counts and technical categories. There is deliberately no
 * field naming a file, a folder, a path, a MIME type or a title, and none must
 * ever be added: an administrator sizes a server here, they do not read a life.
 */
export interface AccountUsage {
    user_id: string;
    quota_bytes: number;
    /** The quota counter — the number enforcement actually reads. */
    used_bytes: number;
    /** What the modules say they charge this account. */
    billable_bytes: number;
    /** Everything physically held for this account. */
    held_bytes: number;
    delegated_bytes: number;
    delegated_objects: number;
    /** `max(0, used − billable)`: counted, claimed by nobody. */
    unattributed_bytes: number;
    /** `max(0, billable − used)`: claimed, never counted. */
    over_declared_bytes: number;
    modules: AccountModuleUsage[];
    categories: CategoryUsage[];
    catalog: CatalogEntry[];
    stale_hours: number;
}
export interface Consumer {
    id: string;
    username: string;
    email: string;
    display_name: string | null;
    is_active: boolean;
    used_bytes: number;
    quota_bytes: number;
    unit_id: string | null;
    unit_name: string | null;
}
export interface ConsumerList {
    consumers: Consumer[];
    limit: number;
    filter: string;
    warn_percent: number;
    /** True when the listing was narrowed to the caller's own subtree. */
    scoped: boolean;
}
export type ConsumerFilter = 'all' | 'near' | 'full';
export type ConsumerSort = 'used' | 'percent';
export declare function useStorageOverview(): import("@tanstack/react-query").UseQueryResult<NoInfer<StorageOverview>, Error>;
export declare function useStorageConsumers(filter: ConsumerFilter, sort: ConsumerSort, limit: number): import("@tanstack/react-query").UseQueryResult<NoInfer<ConsumerList>, Error>;
/**
 * One account's detailed sheet, fetched only while a sheet is open.
 *
 * Same two privileges as the consumers listing: the route names an account, so
 * asking without `core.users.read` would only poll a 403.
 */
export declare function useAccountStorageUsage(userId: string | null): import("@tanstack/react-query").UseQueryResult<NoInfer<AccountUsage>, Error>;
/** One account's ceiling. Audited server-side as `core.users.update`. */
export declare function useSetAccountQuota(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    id: string;
    bytes: number;
}, unknown>;
/**
 * The default a new account receives, at instance or organisational-unit scope.
 *
 * `bytes === null` clears the level, which is what makes the unit inherit its
 * parent again — and keep following it. Writing the inherited value instead
 * would freeze the unit silently the day the parent moved.
 */
export declare function useSetDefaultQuota(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    unitId: string | null;
    bytes: number | null;
}, unknown>;
/** The fill ratio at which an account starts being reported as near its limit. */
export declare function useSetWarnPercent(): import("@tanstack/react-query").UseMutationResult<unknown, Error, number, unknown>;
export declare function errorMessage(err: unknown, fallback: string): string;
