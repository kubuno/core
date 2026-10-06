export declare const api: import("axios").AxiosInstance;
export declare function registerTokenHandlers(get: () => string | null, set: (t: string) => void, clear: () => void): void;
/**
 * Called whenever the access token changes hands (sign-in, refresh, switch,
 * sign-out).
 *
 * The access token is NEVER written to a cookie any more: a script-readable
 * cookie handed the whole API to any XSS. Requests the browser makes without
 * the `Authorization` header (`<img>`, `<video>`, downloads, sockets) use
 * signed tickets instead (`./signedUrl`). This only erases the cookie older
 * versions of this client wrote, and forgets the tickets cached for the
 * previous account.
 */
export declare function onAccessTokenChanged(): void;
/** Whether a session access token is held (false on anonymous public pages). */
export declare function hasAccessToken(): boolean;
