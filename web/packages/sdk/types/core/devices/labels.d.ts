import type { TFunction } from 'i18next';
import type { Approval, Device, DeviceEvent, DeviceSession, DeviceType, SignalLevel, Tri } from './types';
/**
 * Wording of the inventory, in one place.
 *
 * The rule enforced here, and the reason this file is not a handful of inline
 * ternaries: **a declared signal is never presented as verified**. Every helper
 * that renders one of them either carries the "declared by the device" wording
 * or returns a state the caller must label. A value the platform cannot check
 * must never look like one it can.
 */
export declare const deviceTypeLabel: (t: TFunction, type: DeviceType | string) => string;
export declare const approvalLabel: (t: TFunction, approval: Approval | string) => string;
export declare const signalLevelLabel: (t: TFunction, level: SignalLevel | string) => string;
/**
 * Tri-state wording. `unknown` reads as "unknown", never as "no" — the two are
 * different statements and only one of them is a measurement.
 */
export declare const triLabel: (t: TFunction, tri: Tri) => string;
export declare const authStrengthLabel: (t: TFunction, strength: string | null) => string;
export declare const clientKindLabel: (t: TFunction, kind: string | null) => string;
export declare const eventKindLabel: (t: TFunction, kind: DeviceEvent["kind"] | string) => string;
/** Name to show for a device: what the user called it, else what was observed. */
export declare function deviceName(t: TFunction, device: Device): string;
/** Same, for a session row whose device may have been forgotten. */
export declare function sessionName(t: TFunction, session: DeviceSession): string;
export declare const countryLabel: (t: TFunction, code: string | null) => string;
/**
 * Visual skin of an approval state.
 *
 * Theme tokens only, and never an opacity modifier over one: `bg-danger/10`
 * renders as a washed-out smear in dark mode because the token is already
 * near-black there. The `-light` surfaces exist for exactly this.
 */
export declare function approvalSkin(approval: Approval | string): {
    chip: string;
    dot: string;
};
/**
 * Skin of a tri-state chip.
 *
 * `unknown` is deliberately NEUTRAL, not a warning colour: the platform has not
 * asked, which is not a finding. Only an explicit `no` is a finding.
 */
export declare function triSkin(tri: Tri): string;
