/**
 * Code-behind of `ConsumersCard.kbview` (converted from `ConsumersCard.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type DataTableColumn, type DataTableRowAction } from "@ui";
import { type Consumer, type ConsumerFilter, type ConsumerSort } from "./api";
import { ViewBase } from './ConsumersCard.kbview';
import * as __parts from './ConsumersCard.parts';
export type ConsumersCardProps = {
    warnPercent: number;
    /** `/admin/storage?filter=full` — the saturated accounts, addressable directly. */
    initialFilter?: ConsumerFilter;
};
export declare class ConsumersCard extends ViewBase {
    accessor sort: ConsumerSort;
    accessor limit: number;
    accessor inspecting: Consumer | null;
    tr: ConsumersCardStores['t'];
    navigate: ConsumersCardStores['navigate'];
    can: ConsumersCardStores['can'];
    filter: ConsumerFilter;
    setFilter: ConsumersCardHooks['setFilter'];
    data: ConsumersCardHooks['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: ConsumersCardHooks['refetch'];
    rows: Consumer[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        navigate: import("react-router").NavigateFunction;
        can: import("../../authz/types").CanFn;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        filter: ConsumerFilter;
        setFilter: import("react").Dispatch<import("react").SetStateAction<ConsumerFilter>>;
        data: NoInfer<import("./api").ConsumerList> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").ConsumerList>, Error>>;
        rows: Consumer[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get initialFilter(): ConsumerFilter;
    get canEdit(): boolean;
    get columns(): DataTableColumn<Consumer>[];
    get rowActions(): DataTableRowAction<Consumer>[];
    get part1_props(): {
        rows: Consumer[];
        columns: DataTableColumn<Consumer>[];
        isLoading: boolean;
        isError: boolean;
        t: import("i18next").TFunction<"translation", undefined>;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").ConsumerList>, Error>>;
        rowActions: DataTableRowAction<Consumer>[];
        setInspecting: (value: Consumer | null | ((prev: Consumer | null) => Consumer | null)) => void;
        filter: ConsumerFilter;
        setFilter: import("react").Dispatch<import("react").SetStateAction<ConsumerFilter>>;
        sort: ConsumerSort;
        setSort: (value: ConsumerSort | ((prev: ConsumerSort) => ConsumerSort)) => void;
    };
    /** A part of the screen still written in React (<DataTable> columns, rowKey, onRetry, rowActions, onRowClick, filtered, onClearFilters, defaultSort, minTableWidth, t, toolbar, emptyState: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_data_scoped(): boolean;
    get show_rows_limit_limit(): boolean;
    get show_inspecting(): boolean;
    /** `<AccountUsageDialog>`, rendered by a ReactHost. */
    get AccountUsageDialog(): import("react").FunctionComponent<Readonly<import("./AccountUsageDialog").AccountUsageDialogProps>>;
    get account_usage_dialog_props(): Readonly<import("./AccountUsageDialog").AccountUsageDialogProps>;
    openQuota(id: string): void | Promise<void>;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setInspecting` of the TSX: a value, or an update of the previous one. */
    setInspecting(value: Consumer | null | ((prev: Consumer | null) => Consumer | null)): void;
    /** `setSort` of the TSX: a value, or an update of the previous one. */
    setSort(value: ConsumerSort | ((prev: ConsumerSort) => ConsumerSort)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ConsumersCardStores = ReturnType<ConsumersCard['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ConsumersCardHooks = ReturnType<ConsumersCard['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ConsumersCardProps>>;
export default _default;
