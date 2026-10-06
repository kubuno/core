/**
 * Code-behind of `TableDemo.kbview` (converted from `TableDemo.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type DataTableColumn } from "@ui";
import { type DemoMember } from "./fixtures";
import { ViewBase } from './TableDemo.kbview';
import * as __parts from './TableDemo.parts';
export declare class TableDemo extends ViewBase {
    accessor query: string;
    accessor selected: string[];
    accessor state: 'data' | 'loading' | 'error' | 'empty';
    tr: TableDemoStores['t'];
    rows: DemoMember[];
    columns: DataTableColumn<DemoMember>[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        columns: DataTableColumn<DemoMember>[];
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        rows: DemoMember[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get STATES(): Array<{
        id: TableDemo['state'];
        label: string;
    }>;
    /** The rows of the Repeater over `STATES`. */
    get rows_states(): {
        s: {
            id: TableDemo["state"];
            label: string;
        };
        button_class: string;
        key: "data" | "loading" | "error" | "empty";
    }[];
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        rows: DemoMember[];
        columns: DataTableColumn<DemoMember>[];
        state: "data" | "loading" | "error" | "empty";
        setState: (value: "data" | "loading" | "error" | "empty" | ((prev: "data" | "loading" | "error" | "empty") => "data" | "loading" | "error" | "empty")) => void;
        query: string;
        setQuery: (value: TableDemo["query"] | ((prev: TableDemo["query"]) => TableDemo["query"])) => void;
        selected: string[];
        setSelected: (value: string[] | ((prev: string[]) => string[])) => void;
    };
    /** A part of the screen still written in React (<DataTable> t, columns, rowKey, onRetry, filtered, onClearFilters, defaultSort, selectedIds, onSelectionChange, configurableColumns, toolbar, bulkActions, rowActions: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    panel_click(_sender: unknown, args: MouseEventArgs): void;
    /** `setState` of the TSX: a value, or an update of the previous one. */
    setState(value: 'data' | 'loading' | 'error' | 'empty' | ((prev: 'data' | 'loading' | 'error' | 'empty') => 'data' | 'loading' | 'error' | 'empty')): void;
    /** `setQuery` of the TSX: a value, or an update of the previous one. */
    setQuery(value: TableDemo['query'] | ((prev: TableDemo['query']) => TableDemo['query'])): void;
    /** `setSelected` of the TSX: a value, or an update of the previous one. */
    setSelected(value: string[] | ((prev: string[]) => string[])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type TableDemoStores = ReturnType<TableDemo['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type TableDemoHooks = ReturnType<TableDemo['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
