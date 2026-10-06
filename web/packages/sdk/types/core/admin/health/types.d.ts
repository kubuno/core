export type HealthBlock = 'security' | 'exposure' | 'continuity' | 'communications' | 'identity';
/** Painting order of the blocks — worst consequences first. */
export declare const BLOCK_ORDER: HealthBlock[];
export type HealthSeverity = 'critical' | 'warning' | 'info';
export type HealthStatus = 
/** Nothing to do. */
'ok'
/** Actionable, and the report says where. */
 | 'todo'
/** Genuinely wrong, but no screen here can fix it. */
 | 'blocked'
/** The operator decided it does not apply. Reversible. */
 | 'ignored'
/** The premise is absent (testing a relay that is not configured). */
 | 'not_applicable';
/** The observed value, in a form the console renders in the reader's language. */
export interface Observed {
    /** i18n suffix: `admin.hc_val_<key>`, interpolated with `args`. */
    key: string;
    args: Record<string, unknown>;
    /** English rendering, used when a catalogue lags behind the server. */
    summary: string;
}
/**
 * Where to send the operator.
 *
 * `tab` + `verb` form `/admin/<tab>?action=<verb>` — the convention the
 * whole console uses for addressable deep actions.
 */
export interface HealthAction {
    tab: string;
    verb?: string;
    label: string;
}
export interface HealthMuted {
    by?: string | null;
    by_label?: string | null;
    at: string;
    reason?: string | null;
}
export interface HealthCheck {
    id: string;
    block: HealthBlock;
    severity: HealthSeverity;
    status: HealthStatus;
    /** English title; the console prefers `admin.hc_<id>_title`. */
    title: string;
    /** One sentence on the consequence of leaving it undone. */
    why: string;
    value: Observed;
    action?: HealthAction;
    doc_href?: string;
    ignorable: boolean;
    muted?: HealthMuted;
}
export interface HealthCounts {
    total: number;
    ok: number;
    todo: number;
    blocked: number;
    ignored: number;
    not_applicable: number;
    /** Failing checks that are critical — what the global banner keys off. */
    critical: number;
    warning: number;
    info: number;
}
export interface HealthReport {
    /** `null` when the caller may see no scoreable check at all. */
    score: number | null;
    generated_at: string;
    cached: boolean;
    counts: HealthCounts;
    checks: HealthCheck[];
}
/** Does this status count as something still to settle? */
export declare const isFailing: (s: HealthStatus) => boolean;
/** Sort key: criticals first, then warnings, then the rest. */
export declare const SEVERITY_RANK: Record<HealthSeverity, number>;
/**
 * Deep-link a check's action, through the console's single URL builder — the
 * section lands in the path, the verb in the query string.
 */
export declare function actionHref(action: HealthAction): string;
