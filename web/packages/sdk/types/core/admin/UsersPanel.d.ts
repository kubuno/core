/**
 * Code-behind of `UsersPanel.kbview` (converted from `UsersPanel.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import type { OrgUnit, User } from "../types";
import { type OrgUnitScope } from "./OrgUnitScopePanel";
import { ViewBase } from './UsersPanel.kbview';
import * as __parts from './UsersPanel.parts';
export declare class UsersPanel extends ViewBase {
    accessor page: number;
    accessor showCreate: boolean;
    accessor panelCollapsed: boolean;
    accessor bulkPicker: boolean;
    accessor pendingReset: boolean;
    tr: UsersPanelStores['t'];
    can: UsersPanelStores['can'];
    params: URLSearchParams;
    navigate: UsersPanelStores['navigate'];
    search: UsersPanelStores['search'];
    setSearch: UsersPanelStores['setSearch'];
    queryClient: UsersPanelStores['queryClient'];
    toast: UsersPanelStores['toast'];
    confirm: UsersPanelStores['confirm'];
    confirmState: UsersPanelStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    scope: OrgUnitScope;
    setScope: UsersPanelStores['setScope'];
    selected: Set<string>;
    setSelected: UsersPanelStores['setSelected'];
    units: UsersPanelStores['units'];
    data: UsersPanelHooks['data'];
    toggleActive: UsersPanelStores['toggleActive'];
    bulkMove: UsersPanelHooks['bulkMove'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../authz/types").CanFn;
        params: URLSearchParams;
        navigate: import("react-router").NavigateFunction;
        search: string;
        setSearch: import("react").Dispatch<import("react").SetStateAction<string>>;
        queryClient: import("@tanstack/query-core").QueryClient;
        toast: import("@ui").ToastApi;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        scope: OrgUnitScope;
        setScope: import("react").Dispatch<import("react").SetStateAction<OrgUnitScope>>;
        selected: Set<string>;
        setSelected: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
        units: NoInfer<OrgUnit[]> | undefined;
        toggleActive: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, {
            id: string;
            is_active: boolean;
        }, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<{
            users: User[];
            total: number;
        }> | undefined;
        bulkMove: import("@tanstack/react-query").UseMutationResult<{
            moved: number;
        }, Error, string, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get limit(): 20;
    get scopedUnits(): string[];
    get pageIds(): string[];
    get allOnPage(): boolean;
    get canBulk(): boolean;
    get ROLE_COLORS(): Record<string, string>;
    /** `<CreateUserModal>`, rendered by a ReactHost. */
    get CreateUserModal(): typeof __parts.CreateUserModal;
    get create_user_modal_props(): {
        onClose: () => void;
    };
    get show_can_priv_org(): boolean;
    /** `<OrgUnitScopePanel>`, rendered by a ReactHost. */
    get OrgUnitScopePanel(): import("react").FunctionComponent<Readonly<import("./OrgUnitScopePanel").Props>>;
    get org_unit_scope_panel_props(): Readonly<import("./OrgUnitScopePanel").Props>;
    get show_can_priv_settings(): boolean;
    /** `<RegistrationToggle>`, rendered by a ReactHost. */
    get RegistrationToggle(): typeof __parts.RegistrationToggle;
    get span_text(): string;
    get show_can_priv_users(): boolean;
    get show_selected_size(): boolean;
    get text(): string;
    get part1_props(): {
        canBulk: boolean;
        allOnPage: boolean;
        togglePage: () => void;
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../authz/types").CanFn;
        data: NoInfer<{
            users: User[];
            total: number;
        }> | undefined;
        openUser: (u: User, pane?: string) => void;
        selected: Set<string>;
        toggleOne: (id: string) => void;
        unitName: (id: string | null) => string | null;
        ROLE_COLORS: Record<string, string>;
        toggleActive: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, {
            id: string;
            is_active: boolean;
        }, unknown>;
    };
    /** A part of the screen still written in React (<table> has no .kbview element yet). */
    get Part1(): typeof __parts.Part1;
    get show_data_data_total(): boolean;
    get enabled_unless_page(): boolean;
    get span_text2(): string;
    get enabled_unless_page_limit_data(): boolean;
    /** `<OrgUnitPicker>`, rendered by a ReactHost. */
    get OrgUnitPicker(): import("react").FunctionComponent<Readonly<import("./OrgUnitPicker").OrgUnitPickerProps>>;
    get org_unit_picker_props(): Readonly<import("./OrgUnitPicker").OrgUnitPickerProps>;
    get show_confirm_state(): boolean;
    /** `<ConfirmDialog>`, rendered by a ReactHost. */
    get ConfirmDialog(): typeof import("../../ui/ConfirmDialog").default;
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
    unitName(id: string | null): string | null;
    openUser(u: User, pane?: string): void;
    askBulkMove(orgUnitId: string): Promise<void>;
    toggleOne(id: string): void;
    togglePage(): void;
    callout_action(_sender: unknown, _args: EventArgs): undefined;
    text_field_text_changed(_sender: unknown, args: EventArgs): void;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    panel_click(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click3(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click4(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setPanelCollapsed` of the TSX: a value, or an update of the previous one. */
    setPanelCollapsed(value: UsersPanel['panelCollapsed'] | ((prev: UsersPanel['panelCollapsed']) => UsersPanel['panelCollapsed'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type UsersPanelStores = ReturnType<UsersPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type UsersPanelHooks = ReturnType<UsersPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
