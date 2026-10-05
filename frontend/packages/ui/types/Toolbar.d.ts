import React from 'react';
/** One command of a `Toolbar`. */
export interface ToolbarItemDef {
    /** Stable key (the runtime gives the item's x:Name or its position). */
    id?: string;
    /** The command's text; empty for an icon-only command (its `tooltip` then names it). */
    text?: string;
    icon?: React.ReactNode;
    /** Shown under the pointer, and the accessible name of an icon-only command. */
    tooltip?: string;
    disabled?: boolean;
    onClick?: () => void;
}
export interface ToolbarProps {
    items: ToolbarItemDef[];
    /** Paints a background band behind the commands. */
    band?: boolean;
    /** Raised with the item and its index when a command is chosen. */
    onItemClick?: (item: ToolbarItemDef, index: number) => void;
    className?: string;
    style?: React.CSSProperties;
    'aria-label'?: string;
}
/** The next enabled index from `from` in `step` direction (wrapping), or `from` when none. */
export declare function nextEnabled(items: readonly {
    disabled?: boolean;
}[], from: number, step: 1 | -1): number;
/**
 * A row of commands (the `.kbview` `Toolbar`): ghost buttons with an icon and / or a text. One tab stop
 * (`role="toolbar"`, roving tabindex): the arrow keys move between the commands (mirrored in RTL), Home / End go
 * to the first / last, Enter or Space runs the focused one.
 */
export declare const Toolbar: React.ForwardRefExoticComponent<ToolbarProps & React.RefAttributes<HTMLDivElement>>;
