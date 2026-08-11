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
    notifications: AppNotification[];
    unreadCount: number;
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
