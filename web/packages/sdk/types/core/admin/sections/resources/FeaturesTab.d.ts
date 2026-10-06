import { type DataTableColumn, type DataTableRowAction } from "@ui";
import ConfirmDialog from "@ui/ConfirmDialog";
import { type ResourceFeature } from "./api";
import { ViewBase } from './FeaturesTab.kbview';
import * as __parts from './FeaturesTab.parts';
export type FeaturesTabProps = {
    canManage: boolean;
};
export declare class FeaturesTab extends ViewBase {
    accessor editing: ResourceFeature | 'new' | null;
    accessor error: string | null;
    tr: FeaturesTabStores['t'];
    confirm: FeaturesTabStores['confirm'];
    confirmState: FeaturesTabStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    data: FeaturesTabStores['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: FeaturesTabStores['refetch'];
    remove: FeaturesTabStores['remove'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        data: NoInfer<{
            features: ResourceFeature[];
        }> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<{
            features: ResourceFeature[];
        }>, Error>>;
        remove: import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get columns(): DataTableColumn<ResourceFeature>[];
    get rowActions(): DataTableRowAction<ResourceFeature>[];
    get show_error(): boolean;
    get part1_props(): {
        data: NoInfer<{
            features: ResourceFeature[];
        }> | undefined;
        columns: DataTableColumn<ResourceFeature>[];
        isLoading: boolean;
        isError: boolean;
        t: import("i18next").TFunction<"translation", undefined>;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<{
            features: ResourceFeature[];
        }>, Error>>;
        rowActions: DataTableRowAction<ResourceFeature>[];
        canManage: boolean;
        setEditing: (value: ResourceFeature | "new" | null | ((prev: ResourceFeature | "new" | null) => ResourceFeature | "new" | null)) => void;
    };
    /** A part of the screen still written in React (<DataTable> columns, rowKey, onRetry, rowActions, onRowClick, t, toolbar, emptyState: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_editing(): boolean;
    /** `<FeatureDialog>`, rendered by a ReactHost. */
    get FeatureDialog(): import("react").FunctionComponent<Readonly<import("./FeatureDialog").FeatureDialogProps>>;
    get feature_dialog_props(): Readonly<import("./FeatureDialog").FeatureDialogProps>;
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
    setEditing(value: ResourceFeature | 'new' | null | ((prev: ResourceFeature | 'new' | null) => ResourceFeature | 'new' | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type FeaturesTabStores = ReturnType<FeaturesTab['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<FeaturesTabProps>>;
export default _default;
