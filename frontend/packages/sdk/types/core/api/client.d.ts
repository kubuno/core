export declare const api: import("axios").AxiosInstance;
export declare function registerTokenHandlers(get: () => string | null, set: (t: string) => void, clear: () => void): void;
export declare function writeTokenCookie(t: string | null): void;
