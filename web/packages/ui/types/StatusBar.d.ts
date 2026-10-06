import React from 'react';
/** One cell of a `StatusBar`. A text of a single dash is a separator. */
export interface StatusLabelDef {
    id?: string;
    text?: string;
    icon?: React.ReactNode;
    /** Takes the width the other cells leave. */
    spring?: boolean;
    /** A button: lit under the pointer, raises its click. */
    clickable?: boolean;
    disabled?: boolean;
    onClick?: () => void;
}
export interface StatusBarProps {
    items: StatusLabelDef[];
    /** A clickable cell was clicked: the cell and its index. */
    onItemClick?: (item: StatusLabelDef, index: number) => void;
    className?: string;
    style?: React.CSSProperties;
    'aria-label'?: string;
}
/**
 * The status line at the bottom of a window or a pane (the `.kbview` `StatusBar`): small cells of text, separators,
 * a spring cell that pushes the next ones to the end, clickable cells. `role="status"`: screen readers announce its
 * changes politely.
 */
export declare const StatusBar: React.ForwardRefExoticComponent<StatusBarProps & React.RefAttributes<HTMLDivElement>>;
