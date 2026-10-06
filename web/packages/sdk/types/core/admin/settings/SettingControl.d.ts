import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import type { ResolvedSetting } from './scopeTypes';
export interface SettingControlProps {
    setting: ResolvedSetting;
    /** Pending edit if any, otherwise the resolved value. */
    value: unknown;
    /** A level above locked the key, or the caller may read but not write. */
    readOnly: boolean;
    /** Instant write — toggles, checkboxes and closed value sets. */
    onCommit: (value: unknown) => void;
    /** Buffered edit — free text and numbers, saved from the action bar. */
    onDraft: (value: unknown) => void;
    /** The provenance line (inherited / overridden / locked) painted under it. */
    children: ReactNode;
    /** Deep link target: outlines the row the admin search asked for. */
    highlighted?: boolean;
    innerRef?: React.Ref<HTMLDivElement>;
}
/**
 * Label and description: the catalogue first, the server's own text as the
 * fallback. `core.settings` stores one French string per key, so a key with a
 * catalogue entry reads in the operator's language and every other one keeps
 * exactly what it showed before.
 */
export declare function settingLabel(t: TFunction, s: ResolvedSetting): string;
export declare function settingDescription(t: TFunction, s: ResolvedSetting): string;
export default function SettingControl({ setting: s, value, readOnly, onCommit, onDraft, children, highlighted, innerRef, }: SettingControlProps): import("react").JSX.Element;
