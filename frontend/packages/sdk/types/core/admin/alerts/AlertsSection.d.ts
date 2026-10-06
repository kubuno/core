/**
 * Code-behind of `AlertsSection.kbview` (converted from `AlertsSection.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { type DataTableBulkAction, type DataTableColumn, type DataTableRowAction } from "@ui";
import type { AdminSectionProps } from "../sections/registry";
import { type Alert, type AlertFilters, type AlertStatus } from "./types";
import { ViewBase } from './AlertsSection.kbview';
import * as __parts from './AlertsSection.parts';
export type { AdminSectionProps };
export declare class AlertsSection extends ViewBase {
    accessor selected: string[];
    accessor sheet: boolean;
    accessor saving: boolean;
    accessor viewName: string;
    tr: AlertsSectionStores['t'];
    i18n: AlertsSectionStores['i18n'];
    can: AlertsSectionStores['can'];
    toast: AlertsSectionStores['toast'];
    filters: AlertFilters;
    setFilters: AlertsSectionHooks['setFilters'];
    draft: AlertsSectionHooks['draft'];
    setDraft: AlertsSectionHooks['setDraft'];
    summary: AlertsSectionStores['summary'];
    facets: AlertsSectionStores['facets'];
    views: AlertsSectionStores['views'];
    fetchNextPage: AlertsSectionHooks['fetchNextPage'];
    hasNextPage: boolean;
    isFetching: boolean;
    isLoading: boolean;
    isError: boolean;
    refetch: AlertsSectionHooks['refetch'];
    bulk: AlertsSectionStores['bulk'];
    verb: AlertsSectionStores['verb'];
    scan: AlertsSectionStores['scan'];
    saveView: AlertsSectionStores['saveView'];
    deleteView: AlertsSectionStores['deleteView'];
    rows: Alert[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        can: import("../../authz/types").CanFn;
        toast: import("@ui").ToastApi;
        summary: NoInfer<import("./types").AlertSummary> | undefined;
        facets: NoInfer<import("./types").AlertFacets> | undefined;
        views: NoInfer<import("./types").AlertView[]> | undefined;
        bulk: import("@tanstack/react-query").UseMutationResult<unknown, Error, {
            ids: string[];
            status?: AlertStatus;
            assign?: boolean;
            assignee_id?: string | null;
        }, unknown>;
        verb: import("@tanstack/react-query").UseMutationResult<unknown, Error, {
            id: string;
            verb: "retry-jobs" | "discard-jobs";
        }, unknown>;
        scan: import("@tanstack/react-query").UseMutationResult<unknown, Error, unknown, unknown>;
        saveView: import("@tanstack/react-query").UseMutationResult<import("./types").AlertView, Error, {
            name: string;
            filters: Record<string, string>;
        }, unknown>;
        deleteView: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, string, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        filters: AlertFilters;
        setFilters: import("react").Dispatch<import("react").SetStateAction<AlertFilters>>;
        draft: string;
        setDraft: import("react").Dispatch<import("react").SetStateAction<string>>;
        data: import("@tanstack/query-core").InfiniteData<import("./useAlerts").AlertPage, unknown> | undefined;
        fetchNextPage: (options?: import("@tanstack/query-core").FetchNextPageOptions) => Promise<import("@tanstack/query-core").InfiniteQueryObserverResult<import("@tanstack/query-core").InfiniteData<import("./useAlerts").AlertPage, unknown>, Error>>;
        hasNextPage: boolean;
        isFetching: boolean;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<import("@tanstack/query-core").InfiniteData<import("./useAlerts").AlertPage, unknown>, Error>>;
        rows: Alert[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canManage(): boolean;
    get openId(): string | null;
    get anyFilter(): boolean;
    get columns(): DataTableColumn<Alert>[];
    get bulkActions(): DataTableBulkAction<Alert>[];
    get rowActions(): DataTableRowAction<Alert>[];
    get toolbar(): import("react").JSX.Element;
    get show_case_1(): boolean;
    /** `<AlertDetail>`, rendered by a ReactHost. */
    get AlertDetail(): import("react").FunctionComponent<Readonly<import("./AlertDetail").AlertDetailProps>>;
    get alert_detail_props(): Readonly<import("./AlertDetail").AlertDetailProps>;
    get show_main(): boolean;
    get show_summary(): boolean;
    get al_counts_open(): number;
    get al_counts_critical(): number;
    get al_counts_mine(): number;
    /** The rows of the Repeater over `(views ?? [])`. */
    get rows_items(): {
        v: import("./types").AlertView;
        key: string;
    }[];
    get show_not_saving(): boolean;
    get enabled_unless_view_name_trim(): boolean;
    get part1_props(): {
        rows: Alert[];
        columns: DataTableColumn<Alert>[];
        isLoading: boolean;
        isError: boolean;
        t: import("i18next").TFunction<"translation", undefined>;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<import("@tanstack/query-core").InfiniteData<import("./useAlerts").AlertPage, unknown>, Error>>;
        anyFilter: boolean;
        setFilters: import("react").Dispatch<import("react").SetStateAction<AlertFilters>>;
        setDraft: import("react").Dispatch<import("react").SetStateAction<string>>;
        toolbar: import("react").JSX.Element;
        canManage: boolean;
        selected: string[];
        setSelected: (value: string[] | ((prev: string[]) => string[])) => void;
        bulkActions: DataTableBulkAction<Alert>[];
        rowActions: DataTableRowAction<Alert>[];
        navigate: import("react-router").NavigateFunction;
        summary: NoInfer<import("./types").AlertSummary> | undefined;
        summary_last_scan_at: string | null | undefined;
        i18n: import("i18next").i18n;
        scan: import("@tanstack/react-query").UseMutationResult<unknown, Error, unknown, unknown>;
        toast: import("@ui").ToastApi;
    };
    /** A part of the screen still written in React (<DataTable> columns, rowKey, onRetry, filtered, onClearFilters, toolbar, selectedIds, onSelectionChange, bulkActions, rowActions, onRowClick, configurableColumns, t, emptyState: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get enabled_unless_is_fetching(): boolean;
    get button_text(): string;
    get part2_props(): {
        sheet: boolean;
        setSheet: (value: AlertsSection["sheet"] | ((prev: AlertsSection["sheet"]) => AlertsSection["sheet"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
        filters: AlertFilters;
        set: <K extends keyof AlertFilters>(key: K, value: AlertFilters[K]) => void;
        facets: NoInfer<import("./types").AlertFacets> | undefined;
    };
    /** A part of the screen still written in React (<MobileSheet> is no .kbview element (@ui#MobileSheet)). */
    get Part2(): typeof __parts.Part2;
    runVerb(id: string | null, v: 'retry-jobs' | 'discard-jobs'): void;
    set<K extends keyof AlertFilters>(key: K, value: AlertFilters[K]): void;
    move(ids: string[], status: AlertStatus): void;
    applyView(name: string): undefined;
    doSaveView(): undefined;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    panel_click(_sender: unknown, args: MouseEventArgs): undefined;
    panel_click2(_sender: unknown, args: MouseEventArgs): undefined;
    text_field_key_down(_sender: unknown, args: EventArgs): undefined;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click3(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click4(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setSelected` of the TSX: a value, or an update of the previous one. */
    setSelected(value: string[] | ((prev: string[]) => string[])): void;
    /** `setSheet` of the TSX: a value, or an update of the previous one. */
    setSheet(value: AlertsSection['sheet'] | ((prev: AlertsSection['sheet']) => AlertsSection['sheet'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AlertsSectionStores = ReturnType<AlertsSection['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type AlertsSectionHooks = ReturnType<AlertsSection['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
