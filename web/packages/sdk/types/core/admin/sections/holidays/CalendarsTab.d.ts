import { type DataTableColumn, type DataTableRowAction } from "@ui";
import ConfirmDialog from "@ui/ConfirmDialog";
import { type CalendarSummary } from "./api";
import { ViewBase } from './CalendarsTab.kbview';
import * as __parts from './CalendarsTab.parts';
export type CalendarsTabProps = {
    canManage: boolean;
    onOpen: (id: string) => void;
};
export declare class CalendarsTab extends ViewBase {
    accessor search: string;
    accessor countriesOnly: boolean;
    accessor creating: boolean;
    accessor error: string | null;
    tr: CalendarsTabStores['t'];
    confirm: CalendarsTabStores['confirm'];
    confirmState: CalendarsTabStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    data: CalendarsTabHooks['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: CalendarsTabHooks['refetch'];
    setEnabled: CalendarsTabStores['setEnabled'];
    remove: CalendarsTabStores['remove'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        setEnabled: import("@tanstack/react-query").UseMutationResult<any, Error, {
            id: string;
            enabled: boolean;
        }, unknown>;
        remove: import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<CalendarSummary[]> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<CalendarSummary[]>, Error>>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get columns(): DataTableColumn<CalendarSummary>[];
    get rowActions(): DataTableRowAction<CalendarSummary>[];
    get part1_props(): {
        search: string;
        setSearch: (value: CalendarsTab["search"] | ((prev: CalendarsTab["search"]) => CalendarsTab["search"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<TextField LeftIcon>: an icon size the element cannot take). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        setCreating: (value: CalendarsTab["creating"] | ((prev: CalendarsTab["creating"]) => CalendarsTab["creating"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part2(): typeof __parts.Part2;
    get show_error(): boolean;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        data: NoInfer<CalendarSummary[]> | undefined;
        columns: DataTableColumn<CalendarSummary>[];
        isLoading: boolean;
        rowActions: DataTableRowAction<CalendarSummary>[];
        onOpen: (id: string) => void;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<CalendarSummary[]>, Error>>;
        search: string;
        countriesOnly: boolean;
        setSearch: (value: CalendarsTab["search"] | ((prev: CalendarsTab["search"]) => CalendarsTab["search"])) => void;
        setCountriesOnly: (value: CalendarsTab["countriesOnly"] | ((prev: CalendarsTab["countriesOnly"]) => CalendarsTab["countriesOnly"])) => void;
    };
    /** A part of the screen still written in React (<DataTable> t, columns, rowKey, rowActions, onRowClick, onRetry, filtered, onClearFilters, emptyState: no .kbview property). */
    get Part3(): typeof __parts.Part3;
    /** `<CalendarDialog>`, rendered by a ReactHost. */
    get CalendarDialog(): import("react").FunctionComponent<Readonly<import("./CalendarDialog").CalendarDialogProps>>;
    get calendar_dialog_props(): Readonly<import("./CalendarDialog").CalendarDialogProps>;
    get show_confirm_state(): boolean;
    /** `<ConfirmDialog>`, rendered by a ReactHost. */
    get ConfirmDialog(): typeof ConfirmDialog;
    get confirm_dialog_props(): {
        onConfirm: () => void;
        onCancel: () => void;
        resolve: (ok: boolean) => void;
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        variant?: import("@ui").ConfirmVariant;
        hideCancel?: boolean;
    };
    /** `setSearch` of the TSX: a value, or an update of the previous one. */
    setSearch(value: CalendarsTab['search'] | ((prev: CalendarsTab['search']) => CalendarsTab['search'])): void;
    /** `setCreating` of the TSX: a value, or an update of the previous one. */
    setCreating(value: CalendarsTab['creating'] | ((prev: CalendarsTab['creating']) => CalendarsTab['creating'])): void;
    /** `setCountriesOnly` of the TSX: a value, or an update of the previous one. */
    setCountriesOnly(value: CalendarsTab['countriesOnly'] | ((prev: CalendarsTab['countriesOnly']) => CalendarsTab['countriesOnly'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type CalendarsTabStores = ReturnType<CalendarsTab['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type CalendarsTabHooks = ReturnType<CalendarsTab['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<CalendarsTabProps>>;
export default _default;
