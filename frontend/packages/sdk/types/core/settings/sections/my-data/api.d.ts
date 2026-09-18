export declare const MY_EXPORT_KEY: readonly ["me-data-export"];
export type MyExportStatus = 'pending' | 'running' | 'ready' | 'failed' | 'cancelled' | 'expired';
/** One body of data the archive may include. `core` is always present. */
export interface MyExportService {
    id: string;
    /** Which module declared it — `core` for the account sheet itself. */
    module_id: string;
    label: string;
    format: string | null;
    description: string | null;
    /** The account sheet: offered, never unticked. */
    required: boolean;
}
export interface MyExportPolicy {
    /** Hours before a produced archive can be fetched. Zero on a default instance. */
    hold_hours: number;
    /** Days the archive stays available once it can be fetched. */
    retention_days: number;
    /** How many times one archive may be downloaded. */
    max_downloads: number;
    /** Largest per-file ceiling that may be requested, in MiB. */
    max_file_mb: number;
}
export interface MyExportRun {
    id: string;
    status: MyExportStatus;
    services: string[];
    requested_at: string;
    finished_at: string | null;
    available_at: string;
    expires_at: string;
    subjects_total: number;
    subjects_done: number;
    file_name: string | null;
    size_bytes: number | null;
    error: string | null;
    file_deleted: boolean;
    download_count: number;
    download_limit: number | null;
    max_file_mb: number | null;
    /** Resolved by the server: can it be fetched right now? */
    downloadable: boolean;
    /** Fetches left, or `null` when there is no ceiling. */
    downloads_left: number | null;
}
export interface MyExportProgress {
    subjects_total: number;
    subjects_done: number;
    percent: number;
}
export interface MyExportOverview {
    services: MyExportService[];
    policy: MyExportPolicy;
    /** The archive format produced. One value: stated, not offered. */
    format: string;
    active: MyExportRun | null;
    progress: MyExportProgress | null;
    history: MyExportRun[];
    /** The server's clock, so a date is never judged against a skewed browser. */
    now: string;
    covers: string[];
    not_covers: string[];
}
/**
 * Everything the page opens on, in one round trip — and it polls only while
 * something is actually moving. A page that needed three requests to paint would
 * show three different moments of the same instance.
 */
export declare function useMyExport(): import("@tanstack/react-query").UseQueryResult<NoInfer<MyExportOverview>, Error>;
export interface RequestMyExportBody {
    services: string[];
    max_file_mb?: number;
}
export declare function useRequestMyExport(): import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, RequestMyExportBody, unknown>;
/**
 * Where the archive lives. A plain URL rather than a request: the browser
 * streams it straight to disk, with its own progress and its own resume, and
 * nothing of it ever sits in this tab's memory.
 */
export declare const downloadUrl: (id: string) => string;
export declare function errorMessage(err: unknown, fallback: string): string;
