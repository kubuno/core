/**
 * Code-behind of `CalendarDetail.kbview` (converted from `CalendarDetail.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs, type ValueChangedEventArgs } from '@kubuno/views';
import { type DataTableColumn, type DataTableRowAction } from "@ui";
import ConfirmDialog from "@ui/ConfirmDialog";
import { type Holiday } from "./api";
import { ViewBase } from './CalendarDetail.kbview';
import * as __parts from './CalendarDetail.parts';
export type CalendarDetailProps = {
    calendarId: string;
    canManage: boolean;
    onOpenCalendar: (id: string) => void;
};
export declare class CalendarDetail extends ViewBase {
    accessor editing: Holiday | 'new' | null;
    accessor error: string | null;
    tr: CalendarDetailStores['t'];
    i18n: CalendarDetailStores['i18n'];
    confirm: CalendarDetailStores['confirm'];
    confirmState: CalendarDetailStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    year: CalendarDetailStores['year'];
    setYear: CalendarDetailStores['setYear'];
    data: CalendarDetailHooks['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: CalendarDetailHooks['refetch'];
    setEnabled: CalendarDetailStores['setEnabled'];
    remove: CalendarDetailStores['remove'];
    reset: CalendarDetailStores['reset'];
    setExclusions: CalendarDetailHooks['setExclusions'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        year: number;
        setYear: import("react").Dispatch<import("react").SetStateAction<number>>;
        setEnabled: import("@tanstack/react-query").UseMutationResult<any, Error, {
            id: string;
            enabled: boolean;
        }, unknown>;
        remove: import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
        reset: import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<import("./api").CalendarDetail> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").CalendarDetail>, Error>>;
        setExclusions: import("@tanstack/react-query").UseMutationResult<any, Error, string[], unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get locale(): string;
    get columns(): DataTableColumn<Holiday>[];
    get rowActions(): DataTableRowAction<Holiday>[];
    get calendar(): import("./api").HolidayCalendar | undefined;
    get coverage(): string | null;
    get show_data_parent(): boolean;
    get hol_open_parent_name(): string;
    get text(): string;
    get span_text(): string | undefined;
    get show_coverage(): boolean;
    get part1_props(): {
        setEditing: (value: Holiday | "new" | null | ((prev: Holiday | "new" | null) => Holiday | "new" | null)) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part1(): typeof __parts.Part1;
    get show_error(): boolean;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        data: NoInfer<import("./api").CalendarDetail> | undefined;
        columns: DataTableColumn<Holiday>[];
        isLoading: boolean;
        rowActions: DataTableRowAction<Holiday>[];
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").CalendarDetail>, Error>>;
    };
    /** A part of the screen still written in React (<DataTable> t, columns, rowKey, rowActions, onRetry, emptyState: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    get show_editing(): boolean;
    /** `<HolidayDialog>`, rendered by a ReactHost. */
    get HolidayDialog(): import("react").FunctionComponent<Readonly<import("./HolidayDialog").HolidayDialogProps>>;
    get holiday_dialog_props(): Readonly<import("./HolidayDialog").HolidayDialogProps>;
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
    fail(e: unknown): void;
    toggleExclusion(key: string, excluded: boolean): void;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    numeric_field_value_changed(_sender: unknown, args: ValueChangedEventArgs): void;
    /** `setEditing` of the TSX: a value, or an update of the previous one. */
    setEditing(value: Holiday | 'new' | null | ((prev: Holiday | 'new' | null) => Holiday | 'new' | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type CalendarDetailStores = ReturnType<CalendarDetail['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type CalendarDetailHooks = ReturnType<CalendarDetail['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<CalendarDetailProps>>;
export default _default;
