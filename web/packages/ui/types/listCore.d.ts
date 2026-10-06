/**
 * The shared model of the `@ui` list controls (`ListBox`, `CheckedListBox`, `ListView`, `TreeView`): items, the
 * keyboard moves, type-ahead, selection modes, the visible window of a virtualised list and the flattening of
 * a tree. Pure functions (no React, no DOM): the components call them, the unit tests check them.
 */
import type { ComponentType } from 'react';
/** One item of a list (an `Item` element, or a row of `ItemsSource`). */
export interface ListItemDef {
    /** The text shown. A bound row may carry it as `Text`, `text` or `label`. */
    text?: string;
    /** The value (`SelectedValue`); the text when absent. */
    value?: string;
    /** An icon before the text (a Lucide component). */
    icon?: ComponentType<{
        size?: number;
        className?: string;
    }>;
    /** Checked (`CheckedListBox`): the initial state. */
    checked?: boolean;
    /** Expanded (`TreeView`): the initial state. */
    expanded?: boolean;
    /** Child items: a sub-tree (`TreeView`), or the next columns' cells (`ListView`). */
    items?: ListItemDef[];
    /** A stable key (the item's `x:Name`, or its position). */
    key?: string;
    disabled?: boolean;
}
/** The text of an item or of a bound row (`Text` / `text` / `label` / `Label` / `Name`, or the value itself). */
export declare function itemText(it: unknown): string;
/** The value of an item or of a bound row (`value` / `Value`, else its text). */
export declare function itemValue(it: unknown): string;
/** A bound row's or an item's children (`items` / `Items` / `children` / `Children`). */
export declare function itemChildren(it: unknown): readonly unknown[] | undefined;
/** A boolean field of an item or row, in either case (`checked` / `Checked`). */
export declare function itemFlag(it: unknown, name: string): boolean | undefined;
/** The rows a list shows: the bound `ItemsSource` when it is a list, else the `Item` children. */
export declare function listRows(source: unknown, items: readonly unknown[] | undefined): readonly unknown[];
/** Where the focus goes for a navigation key (`null`: not a navigation key). `columns` > 1 for a grid of tiles. */
export declare function moveIndex(key: string, from: number, count: number, page: number, columns?: number, rtl?: boolean): number | null;
/** Type-ahead: the next item, after `from`, whose text starts with `prefix` (case and accents ignored). */
export declare function typeAhead(prefix: string, labels: readonly string[], from: number): number;
/** `SelectionMode` (WinForms names): none, one item, several by plain clicks, several with Ctrl / Shift. */
export type SelectionMode = 'None' | 'One' | 'MultiSimple' | 'MultiExtended';
export interface Selection {
    /** The selected indexes. */
    readonly selected: ReadonlySet<number>;
    /** Where a Shift range starts. */
    readonly anchor: number;
}
/**
 * The selection after choosing `index` with a click or a key: `toggle` is Ctrl (or Space in a multi list),
 * `range` is Shift. `MultiSimple` toggles on every choice; `MultiExtended` replaces unless Ctrl / Shift.
 */
export declare function select(mode: SelectionMode, prev: Selection, index: number, mods?: {
    toggle?: boolean;
    range?: boolean;
}): Selection;
/** The rows to render: those in the viewport plus `overscan` on each side (`end` exclusive). */
export declare function visibleRange(scrollTop: number, viewport: number, rowHeight: number, count: number, overscan?: number): {
    start: number;
    end: number;
};
/** The scroll position that shows row `index` (unchanged when it already shows). */
export declare function scrollToShow(index: number, scrollTop: number, viewport: number, rowHeight: number, header?: number): number;
/** One visible row of a tree. */
export interface TreeRow {
    /** Dot-separated child indexes from the root (`0.2.1`): the `SelectedPath` and the expansion key. */
    readonly path: string;
    readonly item: unknown;
    /** 1 for a root item. */
    readonly level: number;
    readonly hasChildren: boolean;
    readonly expanded: boolean;
    /** 1-based position among its siblings, and their number (`aria-posinset` / `aria-setsize`). */
    readonly posInSet: number;
    readonly setSize: number;
    /** The parent's path (`''` for a root item). */
    readonly parent: string;
}
/** The rows of a tree that show: every root item, and the children of the expanded ones, depth first. */
export declare function flattenTree(roots: readonly unknown[], expanded: ReadonlySet<string>): TreeRow[];
/** The paths of the items marked `Expanded` (their initial state). */
export declare function initiallyExpanded(roots: readonly unknown[]): Set<string>;
/**
 * Left / Right in a tree (WAI-ARIA tree pattern, mirrored in RTL): towards the children expands a closed item,
 * then goes to its first child; towards the parent collapses an open item, then goes to its parent.
 * Returns the new focused row and the expansion to apply, or `null` when the key does nothing.
 */
export declare function treeArrow(key: string, rows: readonly TreeRow[], at: number, rtl?: boolean): {
    focus: number;
    expand?: string;
    collapse?: string;
} | null;
