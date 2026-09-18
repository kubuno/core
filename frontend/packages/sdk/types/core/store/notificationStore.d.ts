export interface AppNotification {
    id: string;
    title: string;
    body: string;
    moduleId: string;
    icon?: string;
    read: boolean;
    createdAt: string;
    link?: string;
    /**
     * Stable identity of the THING being announced (an alert id, a job id…), as
     * opposed to `id` which identifies this notification row.
     *
     * It exists because a producer that polls — the alert centre does — would
     * otherwise re-announce the same open alert on every refresh, and a bell that
     * cries the same news every minute is a bell people silence. See `pushKeyed`.
     */
    key?: string;
}
interface NotificationState {
    /**
     * Bucket key of the ACTIVE account (its user id), announced by the auth
     * store once the session's identity is known. Until then every mutator is a
     * no-op: nothing may be filed under the wrong account.
     */
    activeUserId: string | null;
    /**
     * One notification list PER ACCOUNT of this browser (Google-style
     * multi-account). The compartments are both the isolation — a switched-in
     * account only ever sees its own bucket — and the per-row badges of the
     * account panel, which read the OTHER buckets' unread counts.
     */
    byUser: Record<string, AppNotification[]>;
    /** Mirror of `byUser[activeUserId]` so existing consumers keep their selectors. */
    notifications: AppNotification[];
    unreadCount: number;
    /** Called by the auth store when the session's identity is (re)established. */
    setActiveUser: (userId: string | null) => void;
    /** Forgets an account's bucket (its row was removed from the browser). */
    dropUser: (userId: string) => void;
    push: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
    /**
     * Announces something at most once. Returns silently when a notification
     * already carries `key`, whether it has been read or not: "already told you"
     * includes "told you and you dismissed it".
     */
    pushKeyed: (key: string, n: Omit<AppNotification, 'id' | 'read' | 'createdAt' | 'key'>) => void;
    markRead: (id: string) => void;
    markAllRead: () => void;
    clear: () => void;
}
/** Unread count of ONE account's bucket — the panel's per-row badge. */
export declare function unreadCountOf(byUser: Record<string, AppNotification[]>, userId: string): number;
export declare const useNotificationStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<NotificationState>, "setState" | "persist"> & {
    setState(partial: NotificationState | Partial<NotificationState> | ((state: NotificationState) => NotificationState | Partial<NotificationState>), replace?: false | undefined): unknown;
    setState(state: NotificationState | ((state: NotificationState) => NotificationState), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<NotificationState, unknown, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: NotificationState) => void) => () => void;
        onFinishHydration: (fn: (state: NotificationState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<NotificationState, unknown, unknown>>;
    };
}>;
export {};
