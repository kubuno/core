export interface DockReopenEntry {
    id: string;
    label: string;
}
interface DockReopenState {
    /** Closed panels of the currently mounted DockArea, re-openable from the rail. */
    entries: DockReopenEntry[];
    /** Re-dock a closed panel by id (provided by the active DockArea). */
    reopen: ((id: string) => void) | null;
    /** Called by the DockArea whenever its closed set changes. */
    publish: (entries: DockReopenEntry[], reopen: (id: string) => void) => void;
    /** Called by the DockArea on unmount so a stale reopener never lingers. */
    clear: () => void;
}
export declare const useDockReopenStore: import("zustand").UseBoundStore<import("zustand").StoreApi<DockReopenState>>;
export {};
