import type { ReactNode } from 'react';
import { type SettingItem } from './moduleSettingSchema';
export interface ModuleSettingRowProps {
    item: SettingItem;
    value: unknown;
    /** Differs from the factory default. */
    modified: boolean;
    /** Edited in this session and not saved yet. */
    pending: boolean;
    invalid: boolean;
    /** A level above pinned this value, or the caller may not write here. */
    readOnly?: boolean;
    /**
     * Offer "back to the factory value".
     *
     * False on a unit, where it would be a trap: staging the factory value there
     * and saving does not clear the unit's row, it WRITES the factory value into
     * it — the unit stops following its parent while looking as if it had been
     * put back. On a unit the honest action is "hériter", which the panel renders
     * under the provenance sentence instead.
     */
    showFactoryReset?: boolean;
    /**
     * The at-a-glance state of the value beside the label — inherited, overridden
     * here, locked. Passed in rather than derived: the row knows the module's
     * declaration, only the panel knows which scope is on screen.
     */
    statusPill?: ReactNode;
    /** The provenance sentence under the control, with its revert/lock actions. */
    provenance?: ReactNode;
    onChange: (v: unknown) => void;
    onReset: () => void;
}
export default function ModuleSettingRow({ item, value, modified, pending, invalid, readOnly, showFactoryReset, statusPill, provenance, onChange, onReset, }: ModuleSettingRowProps): import("react").JSX.Element;
