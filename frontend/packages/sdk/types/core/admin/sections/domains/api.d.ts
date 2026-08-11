export declare const DOMAINS_KEY: readonly ["admin-domains"];
export type DomainKind = 'primary' | 'secondary' | 'alias';
export interface Domain {
    id: string;
    name: string;
    kind: DomainKind;
    parent_id: string | null;
    parent_name: string | null;
    verified: boolean;
    verified_at: string | null;
    last_checked_at: string | null;
    /** Why the last probe did not find the record — a sentence, already French. */
    last_error: string | null;
    /** `"10 mx.exemple.fr."`, exactly as the domain publishes them. */
    mx_hosts: string[];
    has_spf: boolean | null;
    has_dmarc: boolean | null;
    mail_checked_at: string | null;
    created_at: string;
    /** Accounts carrying an address at this domain — what a removal would break. */
    account_count: number;
    /** The TXT value to publish, prefix included. */
    expected_record: string;
    record_name: string;
    record_type: string;
}
export interface DomainsPayload {
    domains: Domain[];
    overview: {
        total: number;
        verified: number;
        pending: number;
        aliases: number;
        primary_name: string | null;
    };
    /** What the instance sends mail as, so the page can flag a mismatch. */
    from_address: string | null;
    from_domain: string | null;
    token_prefix: string;
}
export declare function useDomains(): import("@tanstack/react-query").UseQueryResult<NoInfer<DomainsPayload>, Error>;
export declare function useDomainDetail(id: string | null): import("@tanstack/react-query").UseQueryResult<NoInfer<{
    domain: Domain;
    removal_blockers: string[];
}>, Error>;
export declare function useAddDomain(): import("@tanstack/react-query").UseMutationResult<Domain, Error, {
    name: string;
    kind: DomainKind;
    parent_id?: string;
}, unknown>;
/** Reads the DNS now. Slow by nature — the button shows it. */
export declare function useVerifyDomain(): import("@tanstack/react-query").UseMutationResult<Domain, Error, string, unknown>;
export declare function useMailCheck(): import("@tanstack/react-query").UseMutationResult<Domain, Error, string, unknown>;
export declare function usePromoteDomain(): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare function useRemoveDomain(): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
/** The server's message when it has one — it is more specific than ours. */
export declare function errorMessage(err: unknown, fallback: string): string;
