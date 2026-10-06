import type { Device, DeviceSession } from "../../devices/types";
import type { SessionsTab } from './SessionsTab';
declare function DeviceCard({ device, sessions, current, onDisown }: {
    device: Device;
    sessions: DeviceSession[];
    current: boolean;
    onDisown: (device: Device) => void;
}): import("react").JSX.Element;
export { DeviceCard };
export declare function Part1({ t, refetch }: {
    t: NonNullable<SessionsTab['tr']>;
    refetch: NonNullable<SessionsTab['refetch']>;
}): import("react").JSX.Element;
export declare function Part2({ confirmState, handleConfirm, handleCancel }: {
    confirmState: NonNullable<SessionsTab['confirmState']>;
    handleConfirm: NonNullable<SessionsTab['handleConfirm']>;
    handleCancel: NonNullable<SessionsTab['handleCancel']>;
}): import("react").JSX.Element;
