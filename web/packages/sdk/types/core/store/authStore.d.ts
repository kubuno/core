import type { User } from '../types';
import type { EffectivePrivileges } from '../authz/types';
/**
 * Per-account feature switches served by `GET /api/v1/me`.
 *
 * These say whether a whole surface EXISTS for this account, as opposed to what
 * it may do inside one — which is what `privileges` answers. The distinction
 * matters because a switched-off feature must leave no trace in the interface:
 * no disabled button, no greyed menu entry, nothing to ask about.
 *
 * They arrive with `/me` rather than being discovered by calling each feature's
 * own route: the answer is needed before the first paint, and a section that
 * appears half a second late reads as a defect.
 */
export interface MeFeatures {
    /**
     * "Download my data" — the self-service data export. Governed by
     * `data_export.self_service`, resolved by the server for THIS account through
     * the scope chain (instance / organisational unit / group / account).
     */
    data_export_self_service?: boolean;
}
/**
 * Tells the OTHER tabs the active account changed. The refresh cookie is shared
 * by every tab: a tab left un-reloaded would keep showing account A's interface
 * while silently fetching as account B on its next token refresh — mixed
 * identities, the exact thing the hard reload exists to prevent.
 */
export declare function announceAccountSwitched(): void;
interface AuthState {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    isInitialized: boolean;
    /** Présent uniquement entre la vérification du mot de passe et celle du code TOTP. */
    totpSession: string | null;
    /**
     * The caller's own effective privileges, straight from `/me`. `null` means
     * "not loaded yet", never "holds nothing" — an account holding nothing comes
     * back with an empty `privileges` array.
     */
    privileges: EffectivePrivileges | null;
    /**
     * The feature switches of `/me`. `null` means "not loaded yet", and every
     * reader treats that as "absent": hiding a section a moment too long is
     * recoverable, showing one the server would refuse is not.
     */
    features: MeFeatures | null;
    /**
     * Loads `/me` once. Idempotent, and deduplicated across concurrent callers.
     * `force` re-reads even when a block is already held — what a role write does,
     * since granting or revoking can change what the *operator* themselves may see.
     */
    loadPrivileges: (force?: boolean) => Promise<void>;
    login: (email: string, password: string, captcha?: {
        id: string;
        answer: string;
    }) => Promise<{
        requiresTotp: boolean;
    }>;
    /** `kind` says whether the submitted value is a time-based or a backup code. */
    verifyTotp: (code: string, kind?: 'totp' | 'backup') => Promise<void>;
    logout: () => Promise<void>;
    /**
     * Google-style account switch: makes the account parked in `slot` the active
     * session, then HARD-reloads onto the current module's root. The reload is
     * the isolation guarantee — every store, cache and module state is rebuilt
     * under the new identity, nothing of the previous account can leak through.
     */
    switchAccount: (slot: number) => Promise<void>;
    /** « Se déconnecter de tous les comptes » : closes every slot of this browser. */
    logoutAll: () => Promise<void>;
    refreshToken: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
    initialize: () => Promise<void>;
    setToken: (token: string) => void;
}
export declare const useAuthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthState>>;
/**
 * One feature switch of `/me`, as a boolean.
 *
 * Strictly `=== true`: "not loaded yet" and "the server said nothing about it"
 * both read as absent, which is the safe direction for a switch whose job is to
 * make a surface disappear.
 */
export declare function useFeature(name: keyof MeFeatures): boolean;
export {};
