import type { HealthCheck, HealthReport } from './types';
/**
 * The instance health report.
 *
 * One shared cache entry: the landing card, the health page and the global
 * banner all read it, and three components asking the same question three times
 * per navigation is how a "free" banner becomes a request per page.
 *
 * Open to any administrator — the server narrows the report to what the caller
 * may read, so a delegate gets a shorter list rather than a 403 and a blank
 * page. Nothing here is gated client-side for the same reason.
 */
export declare const HEALTH_KEY: readonly ["admin-health-checks"];
export declare function useHealthChecks(): import("@tanstack/react-query").UseQueryResult<NoInfer<HealthReport>, Error>;
/** "Check everything again" — bypasses the server-side cache. */
export declare function useRefreshHealthChecks(): import("@tanstack/react-query").UseMutationResult<HealthReport, Error, void, unknown>;
/** Silence a finding, or put it back. Both are audited server-side. */
export declare function useMuteCheck(): import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, {
    id: string;
    muted: boolean;
    reason?: string;
}, unknown>;
/**
 * The checks still to settle, worst first.
 *
 * Ignored and inapplicable checks are gone by construction: `isFailing` only
 * admits `todo` and `blocked`. That is what makes "ignore" actually remove a
 * line from the landing card instead of merely greying it.
 */
export declare function openTasks(checks: HealthCheck[] | undefined): HealthCheck[];
