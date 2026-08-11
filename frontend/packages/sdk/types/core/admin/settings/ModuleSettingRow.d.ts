import { type SettingItem } from './moduleSettingSchema';
export interface ModuleSettingRowProps {
    item: SettingItem;
    value: unknown;
    /** Differs from the factory default. */
    modified: boolean;
    /** Edited in this session and not saved yet. */
    pending: boolean;
    invalid: boolean;
    onChange: (v: unknown) => void;
    onReset: () => void;
}
export default function ModuleSettingRow({ item, value, modified, pending, invalid, onChange, onReset, }: ModuleSettingRowProps): import("react").JSX.Element;
