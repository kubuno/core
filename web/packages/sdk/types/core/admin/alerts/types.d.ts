export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 
/** Nobody has looked at it yet. */
'new'
/** Somebody took it — the state that stops two operators doing the same work. */
 | 'acknowledged'
/** Stated as fixed. A recurrence after this opens a NEW alert. */
 | 'resolved'
/** Does not apply here. Recurrences keep landing on it, silently. */
 | 'ignored';
/** Painting order: worst first, so the urgent work is never below the rest. */
export declare const SEVERITY_RANK: Record<AlertSeverity, number>;
/** Is the alert still in the queue? */
export declare const isOpen: (s: AlertStatus) => boolean;
/**
 * A recommended action.
 *
 * `tab` + `verb` form `/admin/<tab>?action=<verb>` — the console's
 * deep-action convention (see `adminAction.ts`). `executes` marks the verbs the
 * alert centre performs itself with a POST instead of navigating away.
 */
export interface AlertAction {
    id: string;
    tab: string;
    verb?: string;
    target_id?: string;
    /** Extra query parameters the destination reads (`user`, `audit_action`…). */
    params?: [string, string][];
    /** English wording; the console prefers `admin.alact_<id>`. */
    label: string;
    /** Already filtered server-side: an action here is one the caller may run. */
    privilege: string;
    executes: boolean;
}
export interface Alert {
    id: string;
    source: string;
    /** Catalogue identifier, e.g. `security.login_burst`. */
    kind: string;
    severity: AlertSeverity;
    status: AlertStatus;
    /** English title; the console prefers `admin.al_<kind>_title`. */
    title: string;
    summary: string | null;
    /** Interpolation arguments of the localised wording, and the detail context. */
    payload: Record<string, unknown>;
    module_id: string | null;
    subject_user_id: string | null;
    subject_label: string | null;
    org_unit_id: string | null;
    /** How many times the same problem was observed — what dedup saved us from. */
    occurrences: number;
    first_seen_at: string;
    last_seen_at: string;
    assignee_id: string | null;
    assignee_label: string | null;
    assigned_at: string | null;
    closed_at: string | null;
    created_at: string;
    actions: AlertAction[];
}
export type AlertEventKind = 'created' | 'status' | 'severity' | 'assigned' | 'comment' | 'recurrence';
export interface AlertEvent {
    id: number;
    kind: AlertEventKind;
    actor_id: string | null;
    actor_label: string;
    from_value: string | null;
    to_value: string | null;
    body: string | null;
    occurred_at: string;
}
export interface AlertSummary {
    open: number;
    new: number;
    acknowledged: number;
    critical: number;
    warning: number;
    info: number;
    ignored: number;
    resolved: number;
    /** Open alerts assigned to the caller. */
    mine: number;
    /**
     * When the producers last completed a pass. `null` means they never have —
     * and "nothing to report" is not the same sentence as "nothing has looked".
     */
    last_scan_at: string | null;
}
export interface AlertView {
    id: string;
    name: string;
    filters: Record<string, string>;
    created_at: string;
}
export interface AlertFacets {
    kinds: string[];
    sources: string[];
    assignees: {
        id: string;
        label: string;
    }[];
    /** The whole catalogue, so the filter offers a type not yet produced here. */
    all_kinds: string[];
}
/** The filter set of the queue. Every value is a string so it saves verbatim. */
export interface AlertFilters {
    status: string;
    severity: string;
    kind: string;
    assignee: string;
    q: string;
    from: string;
    to: string;
}
export declare const EMPTY_FILTERS: AlertFilters;
/** Only non-empty filters reach the query string, so the cache key stays stable. */
export declare function toParams(f: AlertFilters): Record<string, string>;
/**
 * URL of an action, through the console's single URL builder. The action carries
 * its extra parameters as pairs (the wire form), so they are turned into the
 * object `adminUrl` takes rather than re-implementing the spelling here — which
 * is precisely how this file used to drift from the rest of the console.
 */
export declare function actionHref(action: AlertAction): string;
