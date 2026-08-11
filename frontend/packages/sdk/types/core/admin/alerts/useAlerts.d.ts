import type { Alert, AlertEvent, AlertFacets, AlertFilters, AlertStatus, AlertSummary, AlertView } from './types';
/**
 * Data access of the alert centre.
 *
 * One shared cache entry per question: the queue, the summary, the facets and a
 * detail. The summary in particular is read by three surfaces at once (the
 * bell, the landing card, the queue header) — three components asking the same
 * thing three times per navigation is how a "free" badge becomes a request per
 * page.
 */
export declare const ALERTS_KEY: readonly ["admin-alerts"];
export declare const SUMMARY_KEY: readonly ["admin-alerts-summary"];
export declare const FACETS_KEY: readonly ["admin-alerts-facets"];
export declare const VIEWS_KEY: readonly ["admin-alerts-views"];
interface AlertPage {
    alerts: Alert[];
    next_cursor: string | null;
}
/** One page of the queue, cursor-paginated (never offset: the queue moves). */
export declare function useAlerts(filters: AlertFilters, enabled?: boolean): import("@tanstack/react-query").UseInfiniteQueryResult<import("@tanstack/query-core").InfiniteData<AlertPage, unknown>, Error>;
/**
 * The counters behind every badge.
 *
 * `enabled` exists because the bell is rendered for every signed-in user, and
 * only an operator holding `core.alerts.read` may ask: firing a 403 per page
 * load for everybody else is exactly the pattern this codebase already removed
 * once from the privileges resolution.
 */
export declare function useAlertSummary(enabled?: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<AlertSummary>, Error>;
export declare function useAlertFacets(enabled?: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<AlertFacets>, Error>;
interface AlertDetail {
    alert: Alert;
    timeline: AlertEvent[];
    related: Alert[];
}
export declare function useAlert(id: string | null): import("@tanstack/react-query").UseQueryResult<NoInfer<AlertDetail>, Error>;
export declare function useSetAlertStatus(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    id: string;
    status: AlertStatus;
    comment?: string;
}, unknown>;
export declare function useAssignAlert(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    id: string;
    assignee_id: string | null;
}, unknown>;
export declare function useCommentAlert(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    id: string;
    comment: string;
}, unknown>;
export declare function useBulkAlerts(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    ids: string[];
    status?: AlertStatus;
    assign?: boolean;
    assignee_id?: string | null;
}, unknown>;
/** The two verbs the alert centre performs itself (dead-lettered jobs). */
export declare function useAlertVerb(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    id: string;
    verb: "retry-jobs" | "discard-jobs";
}, unknown>;
/** "I just fixed it, check again" — the same code path as the scheduled scan. */
export declare function useScanNow(): import("@tanstack/react-query").UseMutationResult<unknown, Error, unknown, unknown>;
export declare function useAlertViews(enabled?: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<AlertView[]>, Error>;
export declare function useSaveAlertView(): import("@tanstack/react-query").UseMutationResult<AlertView, Error, {
    name: string;
    filters: Record<string, string>;
}, unknown>;
export declare function useDeleteAlertView(): import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, string, unknown>;
export {};
