import React from 'react';
import { type ListItemDef, type SelectionMode } from './listCore';
export type { ListItemDef, SelectionMode } from './listCore';
/** The standard row height of the list controls, in pixels (`ItemHeight` 0). */
export declare const LIST_ROW_HEIGHT = 32;
/** The height a list without a `Height` grows to before it scrolls. */
export declare const LIST_MAX_HEIGHT = 320;
export interface ListBoxProps {
    /** The `Item` children. */
    items?: ListItemDef[];
    /** `ItemsSource`: rows to show instead of the items (their `Text` / `text` / `label`). */
    source?: unknown[];
    selectionMode?: SelectionMode;
    /** The selected item (the anchor of a multiple selection); `-1` = none. Controlled when given. */
    selectedIndex?: number;
    /** Called with the new `selectedIndex` and every selected index. */
    onSelectionChange?: (index: number, selected: number[]) => void;
    /** Web: the selected item's value (`ValueMember`, else its text). Controlled when given. */
    selectedValue?: string;
    onSelectedValueChange?: (value: string) => void;
    /** Enter or a double click on an item. */
    onItemActivate?: (item: unknown, index: number) => void;
    /** Row height in pixels; 0 = standard. */
    itemHeight?: number;
    /** Height of the list in pixels; unset = the rows' height up to 320 px, then it scrolls. */
    height?: number;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    'aria-label'?: string;
}
/** What `CheckedListBox` adds to the list (internal). */
interface Checks {
    checked: ReadonlySet<number>;
    toggle: (index: number) => void;
    checkOnClick: boolean;
}
/**
 * The list body shared by `ListBox` and `CheckedListBox`: `role="listbox"` holding the focus itself and pointing
 * at the current option with `aria-activedescendant`, virtualised (only the rows in view are in the DOM, each
 * with `aria-posinset` / `aria-setsize`), keyboard of the WAI-ARIA listbox pattern.
 */
export declare function ListBase({ items, source, selectionMode, selectedIndex, onSelectionChange, selectedValue, onSelectedValueChange, onItemActivate, itemHeight, height, disabled, className, style, checks, rootRef, ...aria }: ListBoxProps & {
    checks?: Checks;
    rootRef?: React.Ref<HTMLDivElement>;
}): React.ReactElement;
/**
 * A list of items to choose from (the `.kbview` `ListBox`): one item, several by plain clicks (`MultiSimple`), or
 * several with Ctrl / Shift (`MultiExtended`); arrow keys, Home / End, Page Up / Page Down and type-ahead.
 * Virtualised: ten thousand rows cost what a screenful does.
 */
export declare const ListBox: React.ForwardRefExoticComponent<ListBoxProps & React.RefAttributes<HTMLDivElement>>;
export interface CheckedListBoxProps extends Omit<ListBoxProps, 'selectionMode' | 'selectedValue' | 'onSelectedValueChange'> {
    /** A click anywhere on an item checks it (else the first click selects, the next one checks). */
    checkOnClick?: boolean;
    /** Called when an item is checked or unchecked. */
    onItemCheck?: (index: number, checked: boolean) => void;
    /** Controlled: the checked indexes. Unset: each item's own `checked` at first, then the user's clicks. */
    checkedIndices?: number[];
}
/**
 * A list whose items carry a check box (the `.kbview` `CheckedListBox`): Space or a click on the box checks an
 * item, `aria-checked` says so; one item at a time is selected.
 */
export declare const CheckedListBox: React.ForwardRefExoticComponent<CheckedListBoxProps & React.RefAttributes<HTMLDivElement>>;
