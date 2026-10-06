/**
 * One active maintenance notice, mirroring the backend `MaintenanceNotice`
 * (served by `/api/v1/config` under `maintenance.notices` and pushed live over
 * the `maintenance` WebSocket channel). `scope` is `"global"` (whole instance)
 * or a module id (that module only).
 */
export interface MaintenanceNotice {
    id: string;
    scope: string;
    message: string;
    kind: string;
    started_at: string;
}
interface MaintenanceState {
    notices: MaintenanceNotice[];
    /** Replace the whole set — used to seed from `/config` on load and reconnect. */
    seed: (notices: MaintenanceNotice[]) => void;
    /** A `start` event: add the notice if not already present. */
    start: (notice: MaintenanceNotice) => void;
    /** An `end` event: drop it by id, or by scope when no id is given. */
    end: (id: string | undefined, scope: string | undefined) => void;
}
export declare const useMaintenanceStore: import("zustand").UseBoundStore<import("zustand").StoreApi<MaintenanceState>>;
/** The active instance-wide notice, if any. */
export declare function useGlobalMaintenance(): MaintenanceNotice | undefined;
/** The active notice for one module, if any. */
export declare function useModuleMaintenance(moduleId: string): MaintenanceNotice | undefined;
export {};
