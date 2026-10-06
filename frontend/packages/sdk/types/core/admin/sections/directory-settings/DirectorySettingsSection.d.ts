/**
 * Code-behind of `DirectorySettingsSection.kbview` (converted from `DirectorySettingsSection.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import { type ActiveScope } from "../../settings/scopeTypes";
import { ViewBase } from './DirectorySettingsSection.kbview';
export declare class DirectorySettingsSection extends ViewBase {
    accessor chainKey: string | null;
    tr: DirectorySettingsSectionStores['t'];
    can: DirectorySettingsSectionStores['can'];
    scope: ActiveScope;
    setScope: DirectorySettingsSectionStores['setScope'];
    policy: DirectorySettingsSectionStores['policy'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../../../authz/types").CanFn;
        scope: ActiveScope;
        setScope: import("react").Dispatch<import("react").SetStateAction<ActiveScope>>;
        policy: {
            setting: (key: string) => import("../../ModuleAdminSettings").ResolvedSetting | undefined;
            isLoading: boolean;
            isError: boolean;
            refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("../../ModuleAdminSettings").ResolvedSetting[]>, Error>>;
            error: string | null;
            clearError: () => void;
            write: (key: string, value: unknown) => void;
            revert: (key: string) => void;
            lock: (key: string, locked: boolean) => void;
        };
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canRead(): boolean;
    get canManage(): boolean;
    get title(): import("react").JSX.Element;
    get known(): string[];
    get chainSetting(): import("../../ModuleAdminSettings").ResolvedSetting | undefined;
    get show_case_1(): boolean;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_title(): {
        children: import("react").JSX.Element;
    };
    get show_main(): boolean;
    get content_title2(): {
        children: import("react").JSX.Element;
    };
    /** `<SettingScopeBar>`, rendered by a ReactHost. */
    get SettingScopeBar(): import("react").FunctionComponent<Readonly<import("../../settings/SettingScopeBar").SettingScopeBarProps>>;
    get setting_scope_bar_props(): {
        scope: ActiveScope;
        onChange: import("react").Dispatch<import("react").SetStateAction<ActiveScope>>;
    };
    get show_can_manage(): boolean;
    get show_policy_error(): boolean;
    get show_not_policy_is_error(): boolean;
    get show_policy_is_loading_known(): boolean;
    get show_not_policy_is_loading_known(): boolean;
    /** `<ToggleRow>`, rendered by a ReactHost. */
    get ToggleRow(): import("react").FunctionComponent<Readonly<import("./PolicyRow").RowProps>>;
    /** The rows of the Repeater over `SHARING_KEYS`. */
    get rows_sharing_keys(): {
        key: "directory.enabled" | "directory.share_email";
        toggle_row_props: {
            setting: import("../../ModuleAdminSettings").ResolvedSetting | undefined;
            policy: {
                setting: (key: string) => import("../../ModuleAdminSettings").ResolvedSetting | undefined;
                isLoading: boolean;
                isError: boolean;
                refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("../../ModuleAdminSettings").ResolvedSetting[]>, Error>>;
                error: string | null;
                clearError: () => void;
                write: (key: string, value: unknown) => void;
                revert: (key: string) => void;
                lock: (key: string, locked: boolean) => void;
            };
            readOnly: boolean;
            onShowChain: (value: string | null | ((prev: string | null) => string | null)) => void;
        } | undefined;
        rowKey: "directory.enabled" | "directory.share_email";
    }[];
    /** `<CheckboxRow>`, rendered by a ReactHost. */
    get CheckboxRow(): import("react").FunctionComponent<Readonly<import("./CheckboxRow").CheckboxRowProps>>;
    /** The rows of the Repeater over `PROFILE_KEYS`. */
    get rows_profile_keys(): {
        key: "directory.profile_edit_name" | "directory.profile_edit_photo" | "directory.profile_edit_name_pronunciation" | "directory.profile_edit_pronouns" | "directory.profile_edit_work_location" | "directory.profile_edit_introduction" | "directory.profile_edit_gender" | "directory.profile_edit_birthday";
        checkbox_row_props: {
            setting: import("../../ModuleAdminSettings").ResolvedSetting | undefined;
            policy: {
                setting: (key: string) => import("../../ModuleAdminSettings").ResolvedSetting | undefined;
                isLoading: boolean;
                isError: boolean;
                refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("../../ModuleAdminSettings").ResolvedSetting[]>, Error>>;
                error: string | null;
                clearError: () => void;
                write: (key: string, value: unknown) => void;
                revert: (key: string) => void;
                lock: (key: string, locked: boolean) => void;
            };
            readOnly: boolean;
            onShowChain: (value: string | null | ((prev: string | null) => string | null)) => void;
            personal: boolean;
        } | undefined;
        rowKey: "directory.profile_edit_name" | "directory.profile_edit_photo" | "directory.profile_edit_name_pronunciation" | "directory.profile_edit_pronouns" | "directory.profile_edit_work_location" | "directory.profile_edit_introduction" | "directory.profile_edit_gender" | "directory.profile_edit_birthday";
    }[];
    /** `<UnstoredFieldRow>`, rendered by a ReactHost. */
    get UnstoredFieldRow(): import("react").FunctionComponent<Readonly<import("./UnstoredFieldRow").UnstoredFieldRowProps>>;
    /** The rows of the Repeater over `PROFILE_FIELDS_NOT_STORED`. */
    get rows_profile_fields_not_stored(): {
        f: "other_personal_info";
        unstored_field_row_props: {
            field: "other_personal_info";
        } | undefined;
        key: "other_personal_info";
    }[];
    /** `<AudienceRow>`, rendered by a ReactHost. */
    get AudienceRow(): import("react").FunctionComponent<Readonly<import("./PolicyRow").RowProps>>;
    get audience_row_props(): {
        setting: import("../../ModuleAdminSettings").ResolvedSetting | undefined;
        policy: {
            setting: (key: string) => import("../../ModuleAdminSettings").ResolvedSetting | undefined;
            isLoading: boolean;
            isError: boolean;
            refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("../../ModuleAdminSettings").ResolvedSetting[]>, Error>>;
            error: string | null;
            clearError: () => void;
            write: (key: string, value: unknown) => void;
            revert: (key: string) => void;
            lock: (key: string, locked: boolean) => void;
        };
        readOnly: boolean;
        onShowChain: (value: string | null | ((prev: string | null) => string | null)) => void;
    };
    get visible(): boolean;
    get visible2(): boolean;
    get show_chain_key(): boolean;
    /** `<InheritanceChainWindow>`, rendered by a ReactHost. */
    get InheritanceChainWindow(): import("react").FunctionComponent<Readonly<import("../../settings/InheritanceChainWindow").InheritanceChainWindowProps>>;
    get inheritance_chain_window_props(): Readonly<import("../../settings/InheritanceChainWindow").InheritanceChainWindowProps>;
    callout_dismiss(_sender: unknown, _args: EventArgs): void;
    empty_state_action(_sender: unknown, _args: EventArgs): undefined;
    /** `setChainKey` of the TSX: a value, or an update of the previous one. */
    setChainKey(value: string | null | ((prev: string | null) => string | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type DirectorySettingsSectionStores = ReturnType<DirectorySettingsSection['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
