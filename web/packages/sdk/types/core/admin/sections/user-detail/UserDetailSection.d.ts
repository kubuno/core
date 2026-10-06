/**
 * Code-behind of `UserDetailSection.kbview` (converted from `UserDetailSection.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import type { NavigateFunction } from "react-router-dom";
import { DataTableSkeleton, type TabDef } from "@ui";
import type { User } from "../../../types";
import { ViewBase } from './UserDetailSection.kbview';
import * as __parts from './UserDetailSection.parts';
type Pane = 'profile' | 'security' | 'activity';
export type UserDetailSectionProps = {
    userId: string;
    params: URLSearchParams;
    navigate: NavigateFunction;
};
export declare class UserDetailSection extends ViewBase {
    tr: UserDetailSectionStores['t'];
    qc: UserDetailSectionStores['qc'];
    toast: UserDetailSectionStores['toast'];
    mobile: boolean;
    confirm: UserDetailSectionStores['confirm'];
    confirmState: UserDetailSectionStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    data: UserDetailSectionHooks['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: UserDetailSectionHooks['refetch'];
    toggleActive: UserDetailSectionHooks['toggleActive'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        qc: import("@tanstack/query-core").QueryClient;
        toast: import("@ui").ToastApi;
        mobile: boolean;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<User> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<User>, Error>>;
        toggleActive: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, boolean, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get paneParam(): Pane | null;
    get pane(): Pane;
    get user(): User;
    get tabs(): TabDef<Pane>[];
    get show_case_1(): boolean;
    /** `<DataTableSkeleton>`, rendered by a ReactHost. */
    get DataTableSkeleton(): typeof DataTableSkeleton;
    get data_table_skeleton_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        columns: number;
        rows: number;
    };
    get show_case_2(): boolean;
    get show_main(): boolean;
    get div_class(): "flex flex-col gap-4" | "flex items-start gap-4";
    /** `<IdentityCard>`, rendered by a ReactHost. */
    get IdentityCard(): import("react").FunctionComponent<Readonly<import("./IdentityCard").Props>>;
    get identity_card_props(): Readonly<import("./IdentityCard").Props>;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        tabs: TabDef<Pane>[];
        pane: Pane;
        setPane: (next: Pane) => Promise<void>;
    };
    /** A part of the screen still written in React (<Tabs> tabs: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_pane_profile(): boolean;
    /** `<ProfileTab>`, rendered by a ReactHost. */
    get ProfileTab(): import("react").FunctionComponent<Readonly<import("./ProfileTab").ProfileTabProps>>;
    get profile_tab_props(): {
        user: User;
    };
    get show_pane_security(): boolean;
    /** `<SecurityTab>`, rendered by a ReactHost. */
    get SecurityTab(): import("react").FunctionComponent<Readonly<import("./SecurityTab").SecurityTabProps>>;
    get security_tab_props(): {
        user: User;
    };
    get show_pane_activity(): boolean;
    /** `<ActivityTab>`, rendered by a ReactHost. */
    get ActivityTab(): import("react").FunctionComponent<Readonly<import("./ActivityTab").ActivityTabProps>>;
    get activity_tab_props(): {
        user: User;
    };
    get show_confirm_state(): boolean;
    /** `<ConfirmDialog>`, rendered by a ReactHost. */
    get ConfirmDialog(): typeof import("../../../../ui/ConfirmDialog").default;
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
    setPane(next: Pane): Promise<void>;
    back(): Promise<void>;
    askToggleActive(user: User): Promise<void>;
    empty_state_action(_sender: unknown, _args: EventArgs): undefined;
    empty_state_secondary_action(_sender: unknown, _args: EventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type UserDetailSectionStores = ReturnType<UserDetailSection['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type UserDetailSectionHooks = ReturnType<UserDetailSection['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<UserDetailSectionProps>>;
export default _default;
