interface UiState {
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;
    headerHidden: boolean;
    openSidebar: () => void;
    closeSidebar: () => void;
    toggleSidebar: () => void;
    toggleSidebarCollapsed: () => void;
    setSidebarCollapsed: (v: boolean) => void;
    setHeaderHidden: (v: boolean) => void;
}
export declare const useUiStore: import("zustand").UseBoundStore<import("zustand").StoreApi<UiState>>;
export {};
