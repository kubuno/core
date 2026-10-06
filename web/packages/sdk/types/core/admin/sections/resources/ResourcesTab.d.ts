import { type DataTableColumn, type DataTableRowAction } from "@ui";
import ConfirmDialog from "@ui/ConfirmDialog";
import { type Resource } from "./api";
import { ViewBase } from './ResourcesTab.kbview';
import * as __parts from './ResourcesTab.parts';
export type ResourcesTabProps = {
    canManage: boolean;
};
export declare class ResourcesTab extends ViewBase {
    accessor editing: Resource | 'new' | null;
    accessor error: string | null;
    tr: ResourcesTabStores['t'];
    confirm: ResourcesTabStores['confirm'];
    confirmState: ResourcesTabStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    data: ResourcesTabStores['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: ResourcesTabStores['refetch'];
    remove: ResourcesTabStores['remove'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        data: NoInfer<import("./api").ResourceList> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").ResourceList>, Error>>;
        remove: import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get columns(): DataTableColumn<Resource>[];
    get rowActions(): DataTableRowAction<Resource>[];
    get show_error(): boolean;
    get part1_props(): {
        data: NoInfer<import("./api").ResourceList> | undefined;
        columns: DataTableColumn<Resource>[];
        isLoading: boolean;
        isError: boolean;
        t: import("i18next").TFunction<"translation", undefined>;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").ResourceList>, Error>>;
        rowActions: DataTableRowAction<Resource>[];
        canManage: boolean;
        setEditing: (value: Resource | "new" | null | ((prev: Resource | "new" | null) => Resource | "new" | null)) => void;
    };
    /** A part of the screen still written in React (<DataTable> columns, rowKey, onRetry, rowActions, onRowClick, configurableColumns, t, toolbar, emptyState: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_editing(): boolean;
    /** `<ResourceDialog>`, rendered by a ReactHost. */
    get ResourceDialog(): import("react").FunctionComponent<Readonly<import("./ResourceDialog").ResourceDialogProps>>;
    get resource_dialog_props(): Readonly<import("./ResourceDialog").ResourceDialogProps>;
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
    /** `setEditing` of the TSX: a value, or an update of the previous one. */
    setEditing(value: Resource | 'new' | null | ((prev: Resource | 'new' | null) => Resource | 'new' | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ResourcesTabStores = ReturnType<ResourcesTab['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<ResourcesTabProps>>;
export default _default;
