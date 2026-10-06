import React from 'react';
export interface SettingsRowProps {
    /** The setting's name, in the label column. */
    label?: React.ReactNode;
    /** A help line under the name. */
    description?: React.ReactNode;
    /** The control(s) that change the setting. */
    children?: React.ReactNode;
    /**
     * `auto` (default): the name in a 240 px column beside the control, stacked above a full-width control on a
     * phone (≤ 640 px); `inline` / `stacked` force one of the two.
     */
    layout?: 'auto' | 'inline' | 'stacked';
    /** Draws the separator line under the row (default `true`; the last row of a list draws none). */
    divider?: boolean;
    className?: string;
    style?: React.CSSProperties;
}
/**
 * One line of a settings page (the `.kbview` `SettingsRow`): the setting's name and its help line, and the
 * control that changes it — the single shared version of the row every module's settings page copied
 * (`flex items-start gap-8 py-4`, a 240 px label column, a line between rows). The name labels the row for
 * screen readers (`role="group"`).
 */
export declare const SettingsRow: React.ForwardRefExoticComponent<SettingsRowProps & React.RefAttributes<HTMLDivElement>>;
