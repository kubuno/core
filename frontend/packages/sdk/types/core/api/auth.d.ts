import type { User } from '../types';
/**
 * One signed-in account of THIS browser (Google-style multi-account). The
 * server enumerates them from its own HttpOnly slot cookies — the cookie jar
 * is the roster, nothing is persisted client-side.
 */
export interface BrowserAccount {
    slot: number;
    active: boolean;
    /** false = the session died server-side → « Déconnecté » row. */
    connected: boolean;
    user: {
        id: string;
        email: string;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    };
}
/** A sign-in CAPTCHA challenge, shaped by its `type`. */
export interface CaptchaChallenge {
    challenge_id: string;
    type: 'text' | 'slider' | 'math';
    /** text */
    image?: string;
    /** math */
    prompt?: string;
    /** slider */
    background?: string;
    piece?: string;
    piece_y?: number;
    max_x?: number;
    width?: number;
    height?: number;
    piece_width?: number;
}
export declare const authApi: {
    register: (data: {
        email: string;
        username: string;
        password: string;
        display_name?: string;
    }) => Promise<import("axios").AxiosResponse<{
        user: User;
    }, any, {}>>;
    login: (data: {
        login: string;
        password: string;
        device_name?: string;
        slot?: number;
        captcha_id?: string;
        captcha_answer?: string;
    }) => Promise<import("axios").AxiosResponse<{
        access_token: string;
        user: User;
        slot?: number;
    } | {
        requires_totp: true;
        totp_session: string;
    }, any, {}>>;
    getCaptcha: () => Promise<import("axios").AxiosResponse<CaptchaChallenge, any, {}>>;
    totpVerify: (data: {
        code?: string;
        backup_code?: string;
        totp_session: string;
        slot?: number;
    }) => Promise<import("axios").AxiosResponse<{
        access_token: string;
        user: User;
    }, any, {}>>;
    logout: (data?: {
        slot?: number;
        all?: boolean;
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    /** Accounts signed into this browser (active first is NOT guaranteed). */
    accounts: () => Promise<import("axios").AxiosResponse<{
        accounts: BrowserAccount[];
    }, any, {}>>;
    /** Make the account parked in `slot` the active session. */
    switchAccount: (slot: number) => Promise<import("axios").AxiosResponse<{
        access_token: string;
        user: User;
        slot: number;
    }, any, {}>>;
    refresh: () => Promise<import("axios").AxiosResponse<{
        access_token: string;
    }, any, {}>>;
    forgotPassword: (email: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    resetPassword: (token: string, new_password: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
