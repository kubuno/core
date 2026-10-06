import type { SettingsGroupPanel } from './SettingsGroupPanel';
export declare function Part1({ section, visibleForBranch, currentValue, canManage, setEdits, update, highlight, highlightRef, revert, lock, setChainKey }: {
    section: NonNullable<SettingsGroupPanel['rows_sections']>[number]['section'];
    visibleForBranch: SettingsGroupPanel['visibleForBranch'];
    currentValue: SettingsGroupPanel['currentValue'];
    canManage: NonNullable<SettingsGroupPanel['canManage']>;
    setEdits: NonNullable<SettingsGroupPanel['setEdits']>;
    update: NonNullable<SettingsGroupPanel['update']>;
    highlight: SettingsGroupPanel['highlight'];
    highlightRef: NonNullable<SettingsGroupPanel['highlightRef']>;
    revert: NonNullable<SettingsGroupPanel['revert']>;
    lock: NonNullable<SettingsGroupPanel['lock']>;
    setChainKey: NonNullable<SettingsGroupPanel['setChainKey']>;
}): import("react").JSX.Element;
