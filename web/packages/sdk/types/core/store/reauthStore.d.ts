/**
 * Queue of callers waiting on one re-authentication dialog.
 *
 * Several sensitive requests can be refused at almost the same instant (a page
 * that saves three things on mount). Opening three dialogs would be absurd and
 * two of them would be answered by nobody, so the store keeps a single pending
 * challenge and resolves every waiter with the same proof — the same reasoning
 * behind the anti-avalanche queue guarding the token refresh in `api/client.ts`.
 */
interface ReauthStore {
    /** Open challenge, or `null` when no dialog is showing. */
    pending: {
        waiters: Array<(token: string | null) => void>;
    } | null;
    /** Requests a proof; resolves with the token, or `null` if the user gave up. */
    request: () => Promise<string | null>;
    /** Called by the dialog once the server issued a proof. */
    resolve: (token: string) => void;
    /** Called when the user closes the dialog. */
    cancel: () => void;
}
export declare const useReauthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ReauthStore>>;
/**
 * Imperative entry point used by the API client's interceptor.
 * Requires `<ReauthHost />` mounted once in the tree (see `App.tsx`).
 */
export declare const requestReauth: () => Promise<string | null>;
export {};
