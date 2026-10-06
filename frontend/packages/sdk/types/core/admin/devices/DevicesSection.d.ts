/**
 * Code-behind of `DevicesSection.kbview` (converted from `DevicesSection.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type DataTableColumn, type DataTableRowAction } from "@ui";
import ConfirmDialog from "@ui/ConfirmDialog";
import type { AdminSectionProps } from "../sections/registry";
import { type Device, type DeviceFilters } from "../../devices/types";
import { ViewBase } from './DevicesSection.kbview';
import * as __parts from './DevicesSection.parts';
export type { AdminSectionProps };
export declare class DevicesSection extends ViewBase {
    accessor sheet: boolean;
    tr: DevicesSectionStores['t'];
    i18n: DevicesSectionStores['i18n'];
    can: DevicesSectionStores['can'];
    toast: DevicesSectionStores['toast'];
    confirm: DevicesSectionStores['confirm'];
    confirmState: DevicesSectionStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    filters: DeviceFilters;
    setFilters: DevicesSectionHooks['setFilters'];
    draft: DevicesSectionHooks['draft'];
    setDraft: DevicesSectionHooks['setDraft'];
    data: DevicesSectionHooks['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: DevicesSectionHooks['refetch'];
    facets: DevicesSectionHooks['facets'];
    setApproval: DevicesSectionStores['setApproval'];
    signOut: DevicesSectionStores['signOut'];
    forget: DevicesSectionStores['forget'];
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
        filters: DeviceFilters;
        setFilters: import("react").Dispatch<import("react").SetStateAction<DeviceFilters>>;
        draft: string;
        setDraft: import("react").Dispatch<import("react").SetStateAction<string>>;
        query: DeviceFilters;
        data: NoInfer<import("../../devices/types").DeviceListResponse> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("../../devices/types").DeviceListResponse>, Error>>;
        facets: NoInfer<import("../../devices/types").DeviceFacets> | undefined;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get openId(): string | null;
    get userId(): string;
    get canManage(): boolean;
    get rows(): Device[];
    get anyFilter(): boolean;
    get columns(): DataTableColumn<Device>[];
    get rowActions(): DataTableRowAction<Device>[];
    get toolbar(): import("react").JSX.Element;
    get show_case_1(): boolean;
    /** `<DeviceDetail>`, rendered by a ReactHost. */
    get DeviceDetail(): import("react").FunctionComponent<Readonly<import("./DeviceDetail").DeviceDetailProps>>;
    get device_detail_props(): Readonly<import("./DeviceDetail").DeviceDetailProps>;
    get show_main(): boolean;
    get show_data(): boolean;
    get count_count(): number;
    get show_user_id(): boolean;
    get show_data_data_country(): boolean;
    get part1_props(): {
        rows: Device[];
        columns: DataTableColumn<Device>[];
        isLoading: boolean;
        isError: boolean;
        t: import("i18next").TFunction<"translation", undefined>;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("../../devices/types").DeviceListResponse>, Error>>;
        anyFilter: boolean;
        setFilters: import("react").Dispatch<import("react").SetStateAction<DeviceFilters>>;
        setDraft: import("react").Dispatch<import("react").SetStateAction<string>>;
        toolbar: import("react").JSX.Element;
        rowActions: DataTableRowAction<Device>[];
        navigate: import("react-router").NavigateFunction;
    };
    /** A part of the screen still written in React (<DataTable> columns, rowKey, onRetry, filtered, onClearFilters, toolbar, rowActions, onRowClick, configurableColumns, t, emptyState: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        sheet: boolean;
        setSheet: (value: DevicesSection["sheet"] | ((prev: DevicesSection["sheet"]) => DevicesSection["sheet"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
        filters: DeviceFilters;
        set: <K extends keyof DeviceFilters>(key: K, value: DeviceFilters[K]) => void;
        facets: NoInfer<import("../../devices/types").DeviceFacets> | undefined;
    };
    /** A part of the screen still written in React (<MobileSheet> is no .kbview element (@ui#MobileSheet)). */
    get Part2(): typeof __parts.Part2;
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
    set<K extends keyof DeviceFilters>(key: K, value: DeviceFilters[K]): void;
    runApproval(device: Device, approval: 'approved' | 'blocked' | 'pending'): void;
    runSignOut(device: Device): void;
    runForget(device: Device): Promise<undefined>;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setSheet` of the TSX: a value, or an update of the previous one. */
    setSheet(value: DevicesSection['sheet'] | ((prev: DevicesSection['sheet']) => DevicesSection['sheet'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type DevicesSectionStores = ReturnType<DevicesSection['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type DevicesSectionHooks = ReturnType<DevicesSection['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
