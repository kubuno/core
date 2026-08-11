import type { User } from '../types';
import type { EffectivePrivileges } from '../authz/types';
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
     * Loads `/me` once. Idempotent, and deduplicated across concurrent callers.
     * `force` re-reads even when a block is already held — what a role write does,
     * since granting or revoking can change what the *operator* themselves may see.
     */
    loadPrivileges: (force?: boolean) => Promise<void>;
    login: (email: string, password: string) => Promise<{
        requiresTotp: boolean;
    }>;
    /** `kind` says whether the submitted value is a time-based or a backup code. */
    verifyTotp: (code: string, kind?: 'totp' | 'backup') => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
    initialize: () => Promise<void>;
    setToken: (token: string) => void;
}
export declare const useAuthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthState>>;
export {};
