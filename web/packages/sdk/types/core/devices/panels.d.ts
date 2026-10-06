import type { ReactNode } from 'react';
import type { Device, DeviceEvent, DeviceSession } from './types';
/** Everything the server read off the requests. Verifiable. */
export declare function DeviceFacts({ device }: {
    device: Device;
}): import("react").JSX.Element;
/**
 * What a native application stated about itself.
 *
 * Never labelled "verified", anywhere, under any setting. The banner is not
 * dismissible and not conditional: it is the frame the values must be read in.
 */
export declare function DeclaredSignals({ device }: {
    device: Device;
}): import("react").JSX.Element;
/** Live sessions of a device. Same rendering for both audiences. */
export declare function SessionList({ sessions, actions }: {
    sessions: DeviceSession[];
    /** Optional per-row control (the personal screen offers "sign out"). */
    actions?: (session: DeviceSession) => ReactNode;
}): import("react").JSX.Element;
/** What has happened to a device. */
export declare function DeviceTimeline({ events }: {
    events: DeviceEvent[];
}): import("react").JSX.Element;
