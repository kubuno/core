import { type DataTableColumn, type DataTableRowAction } from "@ui";
import ConfirmDialog from "@ui/ConfirmDialog";
import { type Building } from "./api";
import { ViewBase } from './BuildingsTab.kbview';
import * as __parts from './BuildingsTab.parts';
export type BuildingsTabProps = {
    canManage: boolean;
};
export declare class BuildingsTab extends ViewBase {
    accessor editing: Building | 'new' | null;
    accessor error: string | null;
    tr: BuildingsTabStores['t'];
    confirm: BuildingsTabStores['confirm'];
    confirmState: BuildingsTabStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    data: BuildingsTabStores['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: BuildingsTabStores['refetch'];
    remove: BuildingsTabStores['remove'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        data: NoInfer<import("./api").BuildingList> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").BuildingList>, Error>>;
        remove: import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get rows(): Building[];
    get columns(): DataTableColumn<Building>[];
    get rowActions(): DataTableRowAction<Building>[];
    get show_error(): boolean;
    get part1_props(): {
        rows: Building[];
        columns: DataTableColumn<Building>[];
        isLoading: boolean;
        isError: boolean;
        t: import("i18next").TFunction<"translation", undefined>;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").BuildingList>, Error>>;
        rowActions: DataTableRowAction<Building>[];
        canManage: boolean;
        setEditing: (value: Building | "new" | null | ((prev: Building | "new" | null) => Building | "new" | null)) => void;
    };
    /** A part of the screen still written in React (<DataTable> columns, rowKey, onRetry, rowActions, onRowClick, configurableColumns, t, toolbar, emptyState: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_editing(): boolean;
    /** `<BuildingDialog>`, rendered by a ReactHost. */
    get BuildingDialog(): import("react").FunctionComponent<Readonly<import("./BuildingDialog").BuildingDialogProps>>;
    get building_dialog_props(): Readonly<import("./BuildingDialog").BuildingDialogProps>;
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
    setEditing(value: Building | 'new' | null | ((prev: Building | 'new' | null) => Building | 'new' | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type BuildingsTabStores = ReturnType<BuildingsTab['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<BuildingsTabProps>>;
export default _default;
