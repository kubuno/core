import type { Approval, DeviceDetailResponse, DeviceFacets, DeviceFilters, DeviceListResponse, MyDevicesResponse, SessionFilters } from './types';
/**
 * Data access of the inventory, for both audiences.
 *
 * The administration hooks and the personal ones sit in the same file so the
 * symmetry stays visible: they call different routes only because the server
 * checks a different perimeter, never because they show different things.
 */
export declare const DEVICES_KEY: readonly ["admin-devices"];
export declare const SESSIONS_KEY: readonly ["admin-sessions"];
export declare const MY_DEVICES_KEY: readonly ["my-devices"];
export declare function useDevices(filters: DeviceFilters, enabled?: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<DeviceListResponse>, Error>;
export declare function useDeviceFacets(enabled?: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<DeviceFacets>, Error>;
export declare function useDevice(id: string | null): import("@tanstack/react-query").UseQueryResult<NoInfer<DeviceDetailResponse>, Error>;
export declare function useAdminSessions(filters: SessionFilters, enabled?: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<{
    sessions: import("./types").DeviceSession[];
    total: number;
}>, Error>;
export declare function useSetApproval(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    id: string;
    approval: Approval;
    reason?: string;
}, unknown>;
export declare function useSignOutDevice(): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
/**
 * Forgets a device.
 *
 * Erases nothing on the machine — see the copy the console shows before it
 * runs. Named `forget`, never `wipe`, because the name is the first place the
 * misreading starts.
 */
export declare function useForgetDevice(): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
export declare function useMyDevices(): import("@tanstack/react-query").UseQueryResult<NoInfer<MyDevicesResponse>, Error>;
export declare function useRenameMyDevice(): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    id: string;
    label: string | null;
}, unknown>;
export declare function useSignOutMyDevice(): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
/**
 * "This was not me."
 *
 * Revokes every session of the account — including the one pressing the
 * button — forces a password change and alerts the operator. The caller is
 * expected to send the user to the sign-in page immediately afterwards.
 */
export declare function useDisownMyDevice(): import("@tanstack/react-query").UseMutationResult<{
    revoked_sessions: number;
    password_change_required: boolean;
}, Error, {
    id: string;
    note?: string;
}, unknown>;
