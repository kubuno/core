/**
 * Code-behind of `AuthMethodsPanel.kbview` (converted from `AuthMethodsPanel.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import ConfirmDialog from "@ui/ConfirmDialog";
import { type ActiveScope, type ResolvedSetting } from "./settings/scopeTypes";
import { ViewBase } from './AuthMethodsPanel.kbview';
import * as __parts from './AuthMethodsPanel.parts';
type MethodId = 'local' | 'directory' | 'sso';
export declare class AuthMethodsPanel extends ViewBase {
    tr: AuthMethodsPanelStores['t'];
    qc: AuthMethodsPanelStores['qc'];
    toast: AuthMethodsPanelStores['toast'];
    confirm: AuthMethodsPanelStores['confirm'];
    confirmState: AuthMethodsPanelStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    scope: ActiveScope;
    setScope: AuthMethodsPanelStores['setScope'];
    data: AuthMethodsPanelHooks['data'];
    isLoading: boolean;
    isError: boolean;
    methods: MethodId[];
    write: AuthMethodsPanelHooks['write'];
    revert: AuthMethodsPanelHooks['revert'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        qc: import("@tanstack/query-core").QueryClient;
        toast: import("@ui").ToastApi;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        scope: ActiveScope;
        setScope: import("react").Dispatch<import("react").SetStateAction<ActiveScope>>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<ResolvedSetting[]> | undefined;
        isLoading: boolean;
        isError: boolean;
        methods: MethodId[];
        write: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, unknown, {
            key: string;
            value: unknown;
        }, unknown>;
        revert: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, unknown, string, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get scopeParams(): {
        scope_type: "instance" | "org_unit";
        scope_id: string | undefined;
    };
    get methodsSetting(): ResolvedSetting | undefined;
    get fallbackSetting(): ResolvedSetting | undefined;
    get fallback(): boolean;
    get lockedAbove(): boolean;
    get inheritedFrom(): string | null | undefined;
    get hasOwn(): boolean;
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_main(): boolean;
    /** `<SettingScopeBar>`, rendered by a ReactHost. */
    get SettingScopeBar(): import("react").FunctionComponent<Readonly<import("./settings/SettingScopeBar").SettingScopeBarProps>>;
    get setting_scope_bar_props(): {
        scope: ActiveScope;
        onChange: import("react").Dispatch<import("react").SetStateAction<ActiveScope>>;
        sticky: boolean;
    };
    get show_scope_type_org(): boolean;
    get callout_text(): string;
    /** `<MethodRow>`, rendered by a ReactHost. */
    get MethodRow(): typeof __parts.MethodRow;
    get method_row_props(): {
        id: "directory" | "local" | "sso";
        icon: React.ReactNode;
        checked: boolean;
        disabled: boolean;
        onChange: (v: boolean) => void;
        t: (k: string) => string;
    };
    get method_row_props2(): {
        id: "directory" | "local" | "sso";
        icon: React.ReactNode;
        checked: boolean;
        disabled: boolean;
        onChange: (v: boolean) => void;
        t: (k: string) => string;
    };
    get method_row_props3(): {
        id: "directory" | "local" | "sso";
        icon: React.ReactNode;
        checked: boolean;
        disabled: boolean;
        onChange: (v: boolean) => void;
        t: (k: string) => string;
    };
    get show_scope_type_org2(): boolean;
    get enabled_unless_fallback_setting_locked_above(): boolean;
    get show_fallback(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Callout> with element children). */
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
    errorOf(e: unknown): string | undefined;
    toggleMethod(id: MethodId, on: boolean): Promise<void>;
    toggleFallback(on: boolean): Promise<void>;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    switch_checked_changed(_sender: unknown, args: EventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AuthMethodsPanelStores = ReturnType<AuthMethodsPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type AuthMethodsPanelHooks = ReturnType<AuthMethodsPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
