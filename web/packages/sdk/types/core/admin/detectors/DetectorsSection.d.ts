import { type DataTableColumn, type DataTableRowAction } from "@ui";
import ConfirmDialog from "@ui/ConfirmDialog";
import type { AdminSectionProps } from "../sections/registry";
import { type Detector } from "./api";
import { ViewBase } from './DetectorsSection.kbview';
import * as __parts from './DetectorsSection.parts';
export type { AdminSectionProps };
export declare class DetectorsSection extends ViewBase {
    accessor editing: string | 'new' | null;
    accessor error: string | null;
    tr: DetectorsSectionStores['t'];
    can: DetectorsSectionStores['can'];
    confirm: DetectorsSectionStores['confirm'];
    confirmState: DetectorsSectionStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    data: DetectorsSectionStores['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: DetectorsSectionStores['refetch'];
    remove: DetectorsSectionStores['remove'];
    openId: string | null;
    rows: Detector[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../../authz/types").CanFn;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        data: NoInfer<import("./api").DetectorList> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").DetectorList>, Error>>;
        remove: import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
        rows: Detector[];
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        openId: string | null;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canManage(): boolean;
    get openParam(): string | null;
    get active(): string | null;
    get columns(): DataTableColumn<Detector>[];
    get rowActions(): DataTableRowAction<Detector>[];
    get show_case_1(): boolean;
    /** `<DetectorEditor>`, rendered by a ReactHost. */
    get DetectorEditor(): import("react").FunctionComponent<Readonly<import("./DetectorEditor").Props>>;
    get detector_editor_props(): Readonly<import("./DetectorEditor").Props>;
    get show_main(): boolean;
    get show_error(): boolean;
    get part1_props(): {
        rows: Detector[];
        columns: DataTableColumn<Detector>[];
        isLoading: boolean;
        isError: boolean;
        t: import("i18next").TFunction<"translation", undefined>;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").DetectorList>, Error>>;
        rowActions: DataTableRowAction<Detector>[];
        setEditing: (value: string | "new" | null | ((prev: string | "new" | null) => string | "new" | null)) => void;
        canManage: boolean;
    };
    /** A part of the screen still written in React (<DataTable> columns, rowKey, onRetry, rowActions, onRowClick, configurableColumns, t, toolbar, emptyState: no .kbview property). */
    get Part1(): typeof __parts.Part1;
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
    setEditing(value: string | 'new' | null | ((prev: string | 'new' | null) => string | 'new' | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type DetectorsSectionStores = ReturnType<DetectorsSection['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type DetectorsSectionHooks = ReturnType<DetectorsSection['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
