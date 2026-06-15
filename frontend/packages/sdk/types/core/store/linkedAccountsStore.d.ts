export interface LinkedAccount {
    id: string;
    instance_url: string;
    user_id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    access_token: string;
    added_at: string;
}
interface LinkedAccountsState {
    accounts: LinkedAccount[];
    add: (account: LinkedAccount) => void;
    remove: (id: string) => void;
    updateToken: (id: string, access_token: string) => void;
}
export declare const useLinkedAccountsStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<LinkedAccountsState>, "setState" | "persist"> & {
    setState(partial: LinkedAccountsState | Partial<LinkedAccountsState> | ((state: LinkedAccountsState) => LinkedAccountsState | Partial<LinkedAccountsState>), replace?: false | undefined): unknown;
    setState(state: LinkedAccountsState | ((state: LinkedAccountsState) => LinkedAccountsState), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<LinkedAccountsState, LinkedAccountsState, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: LinkedAccountsState) => void) => () => void;
        onFinishHydration: (fn: (state: LinkedAccountsState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<LinkedAccountsState, LinkedAccountsState, unknown>>;
    };
}>;
export {};
