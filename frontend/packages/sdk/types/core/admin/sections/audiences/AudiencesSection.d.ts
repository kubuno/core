import { type DataTableColumn, type DataTableRowAction } from "@ui";
import ConfirmDialog from "@ui/ConfirmDialog";
import type { AdminSectionProps } from "../registry";
import { type Audience } from "./api";
import { ViewBase } from './AudiencesSection.kbview';
import * as __parts from './AudiencesSection.parts';
export type { AdminSectionProps };
export declare class AudiencesSection extends ViewBase {
    accessor creating: boolean;
    accessor q: string;
    tr: AudiencesSectionStores['t'];
    can: AudiencesSectionStores['can'];
    data: AudiencesSectionStores['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: AudiencesSectionStores['refetch'];
    create: AudiencesSectionStores['create'];
    remove: AudiencesSectionStores['remove'];
    confirm: AudiencesSectionStores['confirm'];
    confirmState: AudiencesSectionStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    rows: Audience[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../../../authz/types").CanFn;
        data: NoInfer<{
            audiences: Audience[];
            max_applied: number;
        }> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<{
            audiences: Audience[];
            max_applied: number;
        }>, Error>>;
        create: import("@tanstack/react-query").UseMutationResult<{
            audience: Audience;
        }, Error, {
            name: string;
            description?: string | null;
        }, unknown>;
        remove: import("@tanstack/react-query").UseMutationResult<{
            was_applied_to: number;
        }, Error, string, unknown>;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        rows: Audience[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canManage(): boolean;
    get open(): string | null;
    get columns(): DataTableColumn<Audience>[];
    get rowActions(): DataTableRowAction<Audience>[];
    get toolbar(): import("react").JSX.Element;
    get show_case_1(): boolean;
    /** `<AudienceSheet>`, rendered by a ReactHost. */
    get AudienceSheet(): import("react").FunctionComponent<Readonly<import("./AudienceSheet").AudienceSheetProps>>;
    get audience_sheet_props(): {
        id: string;
        canManage: boolean;
    };
    get show_main(): boolean;
    get show_data(): boolean;
    get span_text(): string;
    get part1_props(): {
        rows: Audience[];
        columns: DataTableColumn<Audience>[];
        isLoading: boolean;
        isError: boolean;
        t: import("i18next").TFunction<"translation", undefined>;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<{
            audiences: Audience[];
            max_applied: number;
        }>, Error>>;
        q: string;
        setQ: (value: AudiencesSection["q"] | ((prev: AudiencesSection["q"]) => AudiencesSection["q"])) => void;
        toolbar: import("react").JSX.Element;
        rowActions: DataTableRowAction<Audience>[];
        go: (id: string | null) => void | Promise<void>;
    };
    /** A part of the screen still written in React (<DataTable> columns, rowKey, onRetry, filtered, onClearFilters, toolbar, rowActions, onRowClick, t, emptyState: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    /** `<AudienceDialog>`, rendered by a ReactHost. */
    get AudienceDialog(): import("react").FunctionComponent<Readonly<import("./AudienceDialog").AudienceDialogProps>>;
    get audience_dialog_props(): Readonly<import("./AudienceDialog").AudienceDialogProps>;
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
    go(id: string | null): void | Promise<void>;
    askRemove(a: Audience): Promise<undefined>;
    /** `setQ` of the TSX: a value, or an update of the previous one. */
    setQ(value: AudiencesSection['q'] | ((prev: AudiencesSection['q']) => AudiencesSection['q'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AudiencesSectionStores = ReturnType<AudiencesSection['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type AudiencesSectionHooks = ReturnType<AudiencesSection['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
