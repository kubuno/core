export declare const MIGRATION_KEY: readonly ["admin-data-migration"];
export type CampaignStatus = 'draft' | 'running' | 'paused' | 'done' | 'failed';
export type AccountStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';
/** Which services this instance can migrate, and whether their module is up. */
export interface MigrationService {
    id: string;
    module_id: string;
    available: boolean;
}
export interface CampaignTally {
    accounts: number;
    pending: number;
    running: number;
    done: number;
    failed: number;
    copied: number;
    total: number;
}
export interface Campaign {
    id: string;
    name: string;
    service: string;
    module_id: string;
    source_kind: string;
    source_host: string;
    source_port: number;
    source_security: string;
    since_date: string | null;
    exclude_folders: string[];
    status: CampaignStatus;
    created_by: string | null;
    actor_label: string | null;
    created_at: string;
    started_at: string | null;
    finished_at: string | null;
    /** Why the campaign itself could not run — a sentence, already French. */
    error: string | null;
    tally: CampaignTally;
}
export interface MigrationAccount {
    id: string;
    campaign_id: string;
    source_login: string;
    target_user_id: string;
    target_email: string | null;
    target_name: string | null;
    status: AccountStatus;
    items_copied: number;
    items_total: number;
    attempts: number;
    error: string | null;
    started_at: string | null;
    finished_at: string | null;
    updated_at: string;
}
export interface SourceFolder {
    name: string;
    display_name: string;
    kind: string;
    messages: number;
}
export interface CampaignsPayload {
    campaigns: Campaign[];
    services: MigrationService[];
}
export interface CampaignDetailPayload {
    campaign: Campaign;
    accounts: MigrationAccount[];
}
/** What the wizard sends. The only shape here that carries a password. */
export interface CampaignInput {
    name: string;
    service: string;
    source: {
        kind: string;
        host: string;
        port: number;
        security: string;
    };
    since?: string | null;
    exclude_folders: string[];
    accounts: {
        source_login: string;
        password: string;
        target_user_id: string;
    }[];
    start: boolean;
}
export declare function useCampaigns(): import("@tanstack/react-query").UseQueryResult<NoInfer<CampaignsPayload>, Error>;
export declare function useCampaignDetail(id: string | null): import("@tanstack/react-query").UseQueryResult<NoInfer<CampaignDetailPayload>, Error>;
/** Opens a session on the source and reports what is there. Slow by nature. */
export declare function useProbeSource(): import("@tanstack/react-query").UseMutationResult<{
    ok: boolean;
    folders?: SourceFolder[];
    error?: string;
}, Error, {
    service: string;
    source: {
        kind: string;
        host: string;
        port: number;
        security: string;
    };
    login: string;
    password: string;
}, unknown>;
export declare function useCreateCampaign(): import("@tanstack/react-query").UseMutationResult<Campaign, Error, CampaignInput, unknown>;
export declare function useStartCampaign(): import("@tanstack/react-query").UseMutationResult<Campaign, Error, string, unknown>;
export declare function usePauseCampaign(): import("@tanstack/react-query").UseMutationResult<Campaign, Error, string, unknown>;
export declare function useRetryAccount(): import("@tanstack/react-query").UseMutationResult<MigrationAccount[], Error, {
    id: string;
    accountId: string;
}, unknown>;
export declare function useDeleteCampaign(): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
/** The server's message when it has one — it is more specific than ours. */
export declare function errorMessage(err: unknown, fallback: string): string;
