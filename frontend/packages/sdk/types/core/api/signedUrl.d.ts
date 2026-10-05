export type TicketPurpose = 'view' | 'download' | 'stream' | 'socket';
export interface SignedUrlOptions {
    /** Decides the ticket's lifetime. `view` (default): images, previews.
     *  `download`: a file saved by the browser. `stream`: `<video>`/`<audio>`
     *  (Range requests) and `EventSource`. `socket`: a WebSocket handshake. */
    purpose?: TicketPurpose;
    /** Spend the ticket on its first use (downloads only). */
    once?: boolean;
}
/** Forget every cached ticket — on sign-out and on account switch, so a URL
 *  minted for one account is never handed to another. */
export declare function clearSignedUrlCache(): void;
/** Ticketed same-origin URL for `url` (returned unchanged when it needs none). */
export declare function signedUrl(url: string, opts?: SignedUrlOptions): Promise<string>;
/** Batch form of [`signedUrl`]. */
export declare function signedUrls(urls: string[], opts?: SignedUrlOptions): Promise<string[]>;
/** `ws(s)://host/<path>?kt=…` for a WebSocket on `url` — a path (`/ws`,
 *  `/api/v1/<module>/…`, `/collab/<room>/sync`) or a full same-host `ws(s)://`
 *  URL. A `token=` parameter (the access token older code put there) is
 *  removed. Fetch a new one on every (re)connect: a socket ticket lives one
 *  minute. Other hosts are returned unchanged. */
export declare function signedSocketUrl(url: string): Promise<string>;
/** Starts a browser download of `url` with a one-time ticket. */
export declare function downloadSignedUrl(url: string, filename?: string): Promise<void>;
/** Opens `url` in a new tab with a ticket. The tab is opened synchronously
 *  (still inside the click) and navigated once the ticket arrives, so popup
 *  blockers do not swallow it. */
export declare function openSignedUrl(url: string, opts?: SignedUrlOptions): Promise<void>;
/**
 * React hook: the ticketed form of `url`, `undefined` while it is being
 * fetched (render a placeholder rather than an `<img>` with a bare URL).
 * Re-issued before expiry while mounted (except for `stream`, where swapping
 * the `src` would restart playback — a stream ticket lives for hours).
 */
export declare function useSignedUrl(url: string | null | undefined, opts?: SignedUrlOptions): string | undefined;
