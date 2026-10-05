import React from 'react';
export interface GroupBoxProps {
    /** The group's heading. */
    title?: React.ReactNode;
    /** A help line under the heading. */
    description?: React.ReactNode;
    /** Space around the content, in pixels (all four sides). */
    padding?: number;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}
/**
 * A titled group of controls (the `.kbview` `GroupBox`): a heading, an optional help line, then the content —
 * the shared version of the `Section` the modules' settings pages each defined (`text-lg` heading, `text-xs`
 * description, `pb-10` after the group). The heading names the group for screen readers.
 */
export declare const GroupBox: React.ForwardRefExoticComponent<GroupBoxProps & React.RefAttributes<HTMLElement>>;
