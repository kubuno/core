export interface BackupCodeStatus {
    remaining: number;
    total: number;
    generated_at: string | null;
    low_threshold: number;
    low: boolean;
}
/**
 * Counter and regeneration for the account's backup codes.
 *
 * Regenerating is a **sensitive** action: the server refuses it with
 * `REAUTH_REQUIRED` and the API client's interceptor opens the dialog and
 * replays the call, so there is nothing to do here beyond issuing the request.
 */
export declare function BackupCodesSection(): import("react").JSX.Element;
