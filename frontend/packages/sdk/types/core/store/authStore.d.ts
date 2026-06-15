import type { User } from '../types';
interface AuthState {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    isInitialized: boolean;
    /** Présent uniquement entre la vérification du mot de passe et celle du code TOTP. */
    totpSession: string | null;
    login: (email: string, password: string) => Promise<{
        requiresTotp: boolean;
    }>;
    verifyTotp: (code: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
    initialize: () => Promise<void>;
    setToken: (token: string) => void;
}
export declare const useAuthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthState>>;
export {};
