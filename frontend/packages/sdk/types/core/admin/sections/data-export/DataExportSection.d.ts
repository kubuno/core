/**
 * Code-behind of `DataExportSection.kbview` (converted from `DataExportSection.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import ConfirmDialog from "@ui/ConfirmDialog";
import type { AdminSectionProps } from "../registry";
import { type ExportRun } from "./api";
import { ViewBase } from './DataExportSection.kbview';
import * as __parts from './DataExportSection.parts';
export type { AdminSectionProps };
export declare class DataExportSection extends ViewBase {
    accessor composing: boolean;
    tr: DataExportSectionStores['t'];
    toast: DataExportSectionStores['toast'];
    can: DataExportSectionStores['can'];
    data: DataExportSectionStores['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: DataExportSectionStores['refetch'];
    cancel: DataExportSectionStores['cancel'];
    remove: DataExportSectionStores['remove'];
    confirm: DataExportSectionStores['confirm'];
    confirmState: DataExportSectionStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        toast: import("@ui").ToastApi;
        can: import("../../../authz/types").CanFn;
        data: NoInfer<import("./api").DataExportOverview> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").DataExportOverview>, Error>>;
        cancel: import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
        remove: import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        wasRunning: import("react").RefObject<boolean>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {};
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canRead(): boolean;
    get canExecute(): boolean;
    get selected(): string | null;
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_case_3(): boolean;
    get show_main(): boolean;
    get enabled_unless_data_eligibility_ok(): boolean;
    /** `<Eligibility>`, rendered by a ReactHost. */
    get Eligibility(): typeof __parts.Eligibility;
    get eligibility_props(): {
        data: NoInfer<import("./api").DataExportOverview>;
        canExecute: boolean;
    };
    /** `<ActiveRun>`, rendered by a ReactHost. */
    get ActiveRun(): typeof __parts.ActiveRun;
    get active_run_props(): {
        data: NoInfer<import("./api").DataExportOverview>;
        canExecute: boolean;
        onCancel: (id: string) => Promise<void>;
        busy: boolean;
    };
    /** `<Coverage>`, rendered by a ReactHost. */
    get Coverage(): typeof __parts.Coverage;
    get coverage_props(): {
        data: NoInfer<import("./api").DataExportOverview>;
    };
    /** `<PolicySummary>`, rendered by a ReactHost. */
    get PolicySummary(): typeof __parts.PolicySummary;
    /** `<History>`, rendered by a ReactHost. */
    get History(): typeof __parts.History;
    get history_props(): {
        data: NoInfer<import("./api").DataExportOverview>;
        canExecute: boolean;
        onOpen: (id: string | null) => void | Promise<void>;
        onCancel: (id: string) => Promise<void>;
        onDelete: (run: ExportRun) => Promise<void>;
    };
    get show_selected(): boolean;
    /** `<ExportSubjectsCard>`, rendered by a ReactHost. */
    get ExportSubjectsCard(): import("react").FunctionComponent<Readonly<import("./ExportSubjectsCard").ExportSubjectsCardProps>>;
    get export_subjects_card_props(): Readonly<import("./ExportSubjectsCard").ExportSubjectsCardProps>;
    /** `<ExportRequestDialog>`, rendered by a ReactHost. */
    get ExportRequestDialog(): import("react").FunctionComponent<Readonly<import("./ExportRequestDialog").ExportRequestDialogProps>>;
    get export_request_dialog_props(): Readonly<import("./ExportRequestDialog").ExportRequestDialogProps>;
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
    open(id: string | null): void | Promise<void>;
    askCancel(id: string): Promise<void>;
    askDelete(run: ExportRun): Promise<void>;
    empty_state_action(_sender: unknown, _args: EventArgs): undefined;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type DataExportSectionStores = ReturnType<DataExportSection['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type DataExportSectionHooks = ReturnType<DataExportSection['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
