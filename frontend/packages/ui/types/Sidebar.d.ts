import React from 'react';
/** One line of a `Sidebar`: a row (`kind` `item`) or a section header (`section`). */
export interface SidebarItemDef {
    kind?: 'item' | 'section';
    /** The runtime's stable key of the element (its x:Name, else its position). */
    id?: string;
    /** The value of `SelectedItem` when the row is active (`Key`); empty: the x:Name, else the text. */
    key?: string;
    text?: string;
    icon?: React.ReactNode;
    /** Rows under this one (shown indented once it is expanded). */
    items?: SidebarItemDef[];
    /** Children shown at first. */
    expanded?: boolean;
    disabled?: boolean;
    /** Indentation level of a row made from `ItemsSource` (0 = top). */
    level?: number;
    onClick?: () => void;
}
export interface SidebarProps {
    items?: SidebarItemDef[];
    /** Rows made from a list (fields Text, Icon, Key, Level, Kind = Section), instead of `items`. */
    source?: ReadonlyArray<Record<string, unknown>>;
    /** The active row's key. */
    value?: string;
    /** `true`: an icon rail (the labels as tooltips). */
    collapsed?: boolean;
    /** A row was chosen (click, Enter or Space): its key. */
    onItemInvoked?: (key: string) => void;
    /** The active row changed: its key. */
    onChange?: (key: string) => void;
    className?: string;
    style?: React.CSSProperties;
    'aria-label'?: string;
}
/** A row's key: its `Key`, else its x:Name (not a positional key), else its text. */
export declare function sidebarKey(it: SidebarItemDef): string;
/** Rows from a list: Text / Icon / Key / Level / Kind fields, in either case. */
export declare function sidebarRowsFrom(rows: ReadonlyArray<Record<string, unknown>>): SidebarItemDef[];
/**
 * A navigation list (the `.kbview` `Sidebar`): rows with an icon and a label, section headers, rows with children
 * that fold; the active row is marked (`aria-current="page"`). `Compact` shows an icon rail with the labels as
 * tooltips. The rows are links of a `<nav>`: Tab walks them, Enter or Space chooses one.
 */
export declare const Sidebar: React.ForwardRefExoticComponent<SidebarProps & React.RefAttributes<HTMLElement>>;
