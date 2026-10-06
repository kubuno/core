/**
 * Code-behind of `DeviceDetail.kbview` (converted from `DeviceDetail.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import ConfirmDialog from "@ui/ConfirmDialog";
import { DeclaredSignals, DeviceFacts, DeviceTimeline, SessionList } from "../../devices/panels";
import { ViewBase } from './DeviceDetail.kbview';
export type DeviceDetailProps = {
    id: string;
    onBack: () => void;
};
export declare class DeviceDetail extends ViewBase {
    tr: DeviceDetailStores['t'];
    i18n: DeviceDetailStores['i18n'];
    can: DeviceDetailStores['can'];
    toast: DeviceDetailStores['toast'];
    confirm: DeviceDetailStores['confirm'];
    confirmState: DeviceDetailStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    data: DeviceDetailHooks['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: DeviceDetailHooks['refetch'];
    setApproval: DeviceDetailStores['setApproval'];
    signOut: DeviceDetailStores['signOut'];
    forget: DeviceDetailStores['forget'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        can: import("../../authz/types").CanFn;
        toast: import("@ui").ToastApi;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        setApproval: import("@tanstack/react-query").UseMutationResult<unknown, Error, {
            id: string;
            approval: import("../../devices/types").Approval;
            reason?: string;
        }, unknown>;
        signOut: import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
        forget: import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<import("../../devices/types").DeviceDetailResponse> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("../../devices/types").DeviceDetailResponse>, Error>>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canManage(): boolean;
    get device(): import("../../devices/types").Device;
    get skin(): {
        chip: string;
        dot: string;
    };
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_main(): boolean;
    get h1_text(): string;
    get span_class(): string;
    get span_text(): string;
    get show_device_approval_blocked(): boolean;
    get callout_text(): string;
    get show_device_approval_approved(): boolean;
    get show_device_approval_blocked2(): boolean;
    get show_not_device_approval_blocked(): boolean;
    get enabled_unless_data_sessions(): boolean;
    /** `<DeviceFacts>`, rendered by a ReactHost. */
    get DeviceFacts(): typeof DeviceFacts;
    get device_facts_props(): {
        device: import("../../devices/types").Device;
    };
    /** `<DeclaredSignals>`, rendered by a ReactHost. */
    get DeclaredSignals(): typeof DeclaredSignals;
    get sessions_title_n(): number;
    /** `<SessionList>`, rendered by a ReactHost. */
    get SessionList(): typeof SessionList;
    get session_list_props(): {
        sessions: import("../../devices/types").DeviceSession[];
    };
    /** `<DeviceTimeline>`, rendered by a ReactHost. */
    get DeviceTimeline(): typeof DeviceTimeline;
    get device_timeline_props(): {
        events: import("../../devices/types").DeviceEvent[];
    };
    get p_text(): string;
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
    apply(approval: 'approved' | 'blocked' | 'pending'): void;
    doForget(): Promise<undefined>;
    empty_state_action(_sender: unknown, _args: EventArgs): undefined;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click3(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click4(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click5(_sender: unknown, _args: MouseEventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type DeviceDetailStores = ReturnType<DeviceDetail['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type DeviceDetailHooks = ReturnType<DeviceDetail['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<DeviceDetailProps>>;
export default _default;
