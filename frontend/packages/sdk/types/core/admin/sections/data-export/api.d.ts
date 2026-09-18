export declare const DATA_EXPORT_KEY: readonly ["admin-data-export"];
export type ExportScope = 'instance' | 'accounts';
export type ExportStatus = 'pending' | 'running' | 'ready' | 'failed' | 'cancelled' | 'expired';
export type SubjectStatus = 'pending' | 'done' | 'partial' | 'failed';
/** One body of data an archive may include. `core` is always present. */
export interface ExportService {
    id: string;
    module_id: string;
    label: string;
    format: string | null;
    description: string | null;
    /** The core's own record: offered, never unticked. */
    required: boolean;
}
export interface ExportPolicy {
    hold_hours: number;
    retention_days: number;
    max_file_mb: number;
    module_timeout_s: number;
    require_2fa: boolean;
    min_admin_age_days: number;
    destination: string;
}
/**
 * Why this operator may not trigger an export. A list of stable reasons the
 * console translates — never a bare boolean, because every one of them has a fix
 * the person can act on.
 */
export interface ExportBlocker {
    reason: string;
    days?: number;
    required?: number;
    detail?: string;
    export_id?: string;
}
export interface ExportEligibility {
    ok: boolean;
    blockers: ExportBlocker[];
}
export interface ExportRun {
    id: string;
    scope: ExportScope;
    services: string[];
    with_instance: boolean;
    requested_by: string | null;
    actor_label: string | null;
    status: ExportStatus;
    requested_at: string;
    started_at: string | null;
    finished_at: string | null;
    duration_ms: number | null;
    /** When the hold elapses and the archive becomes downloadable. */
    available_at: string;
    /** When the retention pass deletes it, downloaded or not. */
    expires_at: string;
    subjects_total: number;
    subjects_done: number;
    file_name: string | null;
    destination: string | null;
    size_bytes: number | null;
    entries_count: number | null;
    error: string | null;
    file_deleted: boolean;
    deleted_at: string | null;
    download_count: number;
    last_downloaded_at: string | null;
}
export interface ExportProgress {
    subjects_total: number;
    subjects_done: number;
    percent: number;
}
export interface ExportSubject {
    id: string;
    user_id: string | null;
    user_label: string;
    folder: string;
    status: SubjectStatus;
    size_bytes: number | null;
    services_ok: string[];
    services_ko: string[];
    error: string | null;
}
export interface DataExportOverview {
    policy: ExportPolicy;
    eligibility: ExportEligibility;
    active: ExportRun | null;
    progress: ExportProgress | null;
    history: ExportRun[];
    /** The server's clock, so the hold is never judged against a skewed browser. */
    now: string;
    active_accounts: number;
    services: ExportService[];
    covers: string[];
    not_covers: string[];
    contract: number;
    can_execute: boolean;
}
export declare function useDataExport(): import("@tanstack/react-query").UseQueryResult<NoInfer<DataExportOverview>, Error>;
/** Which accounts one export covered, and what each of them produced. */
export declare function useExportSubjects(exportId: string | null): import("@tanstack/react-query").UseQueryResult<NoInfer<ExportSubject[]>, Error>;
export interface RequestExportBody {
    scope: ExportScope;
    user_ids?: string[];
    services: string[];
    with_instance: boolean;
}
export declare function useRequestExport(): import("@tanstack/react-query").UseMutationResult<unknown, Error, RequestExportBody, unknown>;
export declare function useCancelExport(): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useDeleteExport(): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
/**
 * Where the archive lives. A plain URL rather than a request: the browser
 * streams it straight to disk, with its own progress and its own resume, and
 * nothing of it ever sits in this tab's memory.
 */
export declare const downloadUrl: (id: string) => string;
export declare function errorMessage(err: unknown, fallback: string): string;
