export interface AppNotification {
    id: string;
    title: string;
    body: string;
    moduleId: string;
    icon?: string;
    read: boolean;
    createdAt: string;
    link?: string;
}
interface NotificationState {
    notifications: AppNotification[];
    unreadCount: number;
    push: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
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
