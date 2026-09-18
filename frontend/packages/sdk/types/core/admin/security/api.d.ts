import type { DashboardPanel, PanelBucket, PanelPeriod, PanelPoint, PanelSlice } from '../panels/types';
/**
 * The security dashboard's data layer — one read, no writes.
 *
 * The page performs no action of its own: every panel links to the report that
 * owns the records behind it (the audit trail, the alert queue, the rule log,
 * the device inventory), and those screens already carry their verbs and their
 * audit entries. A second write path here would be a second place to forget one.
 *
 * ## Nothing on this page is estimated
 *
 * Every figure the endpoint returns is a `COUNT(*)` over a table the core itself
 * writes. Families the reference console also charts — message authentication,
 * transport encryption, spam filtering, external file shares — are absent rather
 * than approximated: they live in module schemas the core never reads, and a
 * plausible-looking curve over data nobody measured is the one thing a security
 * overview must never draw.
 */
/** One bucket of a series. `bucket` is a local wall-clock instant. */
export type SecurityPoint = PanelPoint;
export type SecuritySlice = PanelSlice;
/**
 * One panel, as the server computed it.
 *
 * `previous_total` covers the window of identical length immediately before the
 * reading — including for a period still running, which is read up to now on
 * both sides so three days of a month are never compared against a whole one.
 * This endpoint always states it: every security panel counts events, and events
 * have a past.
 */
export type SecurityPanel = DashboardPanel;
export type SecurityBucket = PanelBucket;
export type SecurityPeriod = PanelPeriod;
/** How far back each source can still answer, in days. */
export interface SecurityRetention {
    audit_days: number;
    alerts_days: number;
    rule_executions_days: number;
    event_log_days: number;
}
export interface SecurityDashboard {
    period: SecurityPeriod;
    /** The closed list of selectable windows, in display order. */
    periods: string[];
    panels: SecurityPanel[];
    /** Panels the caller does not hold the privilege for, at instance scope. */
    withheld: string[];
    retention: SecurityRetention;
}
export declare const SECURITY_DASHBOARD_KEY: readonly ["admin-security-dashboard"];
/**
 * The whole page, for one period.
 *
 * Skipped without `core.audit.read`: the endpoint gates on it, and polling a 403
 * would be the only thing the page did.
 */
export declare function useSecurityDashboard(period: string): import("@tanstack/react-query").UseQueryResult<NoInfer<SecurityDashboard>, Error>;
export declare function errorMessage(err: unknown, fallback: string): string;
