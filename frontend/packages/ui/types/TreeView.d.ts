import React from 'react';
import { type ListItemDef } from './listCore';
export interface TreeViewProps {
    /** The `Item` children (nested `Item`s make sub-trees). */
    items?: ListItemDef[];
    /** `ItemsSource`: rows to show instead of the items; a row's `items` / `Items` / `children` list nests. */
    source?: unknown[];
    /** The selected item, as indexes separated by dots (`0.2.1`); `''` = none. Controlled when given. */
    selectedPath?: string;
    onSelectionChange?: (path: string, selected: string[]) => void;
    multiSelect?: boolean;
    /** Enter or a double click on an item: the item and its position among the shown rows. */
    onItemActivate?: (item: unknown, index: number) => void;
    /** Row height in pixels; 0 = standard. */
    itemHeight?: number;
    /** Height of the tree in pixels; unset = the rows' height up to 320 px, then it scrolls. */
    height?: number;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    'aria-label'?: string;
}
/**
 * A tree of items that expand (the `.kbview` `TreeView`): WAI-ARIA tree pattern — `role="tree"`, treeitems with
 * `aria-level`, `aria-setsize`, `aria-posinset`, `aria-expanded`; Up / Down, Home / End, Page Up / Page Down,
 * Right (Left in RTL) expands then enters, Left collapses then goes to the parent, Enter activates, type-ahead.
 * Virtualised over the shown rows.
 */
export declare const TreeView: React.ForwardRefExoticComponent<TreeViewProps & React.RefAttributes<HTMLDivElement>>;
