export interface KV {
    key: string;
    count: number;
}
export interface Series {
    date: string;
    count: number;
}
export interface TopStorage {
    name: string;
    used: number;
    quota: number;
}
export interface Stats {
    users_total: number;
    users_active: number;
    storage_used: number;
    storage_quota_total?: number;
    modules_active: number;
    sessions_active?: number;
    users_online?: number;
    sessions_24h?: number;
    new_users_7d?: number;
    new_users_30d?: number;
    users_by_role?: KV[];
    sessions_by_device?: KV[];
    modules_by_status?: KV[];
    signups_daily?: Series[];
    logins_daily?: Series[];
    events_daily?: Series[];
    top_storage?: TopStorage[];
}
/**
 * Instance-wide statistics, polled every 30s (single shared query cache entry).
 *
 * Skipped entirely without `core.stats.read`: the landing page is open to any
 * administrator, including delegated ones who do not hold it, and firing the
 * request anyway would poll a 403 every 30 seconds.
 */
export declare function useAdminStats(): import("@tanstack/react-query").UseQueryResult<NoInfer<Stats>, Error>;
