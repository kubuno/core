import type { User } from '../types';
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
    }) => Promise<import("axios").AxiosResponse<{
        access_token: string;
        user: User;
    } | {
        requires_totp: true;
        totp_session: string;
    }, any, {}>>;
    totpVerify: (data: {
        code: string;
        totp_session: string;
    }) => Promise<import("axios").AxiosResponse<{
        access_token: string;
        user: User;
    }, any, {}>>;
    logout: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    refresh: () => Promise<import("axios").AxiosResponse<{
        access_token: string;
    }, any, {}>>;
    forgotPassword: (email: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    resetPassword: (token: string, new_password: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
