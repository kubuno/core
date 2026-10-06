/**
 * Code-behind of `ModuleAdminPage.kbview` (converted from `ModuleAdminPage.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import { type ReactNode } from "react";
import type { AdminSectionProps } from "./sections/registry";
import { type ModuleAdminSection } from "../slots/SlotRegistry";
import { type AdminModule, type ModuleLiveState, type ModuleSettingGroup } from "./adminModules";
import { type ActiveScope } from "./settings/scopeTypes";
import { ViewBase } from './ModuleAdminPage.kbview';
export type { AdminSectionProps };
export declare class ModuleAdminPage extends ViewBase {
    tr: ModuleAdminPageStores['t'];
    i18n: ModuleAdminPageStores['i18n'];
    data: ModuleAdminPageStores['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: ModuleAdminPageStores['refetch'];
    liveState: (module: AdminModule) => ModuleLiveState;
    settings: ModuleAdminPageHooks['settings'];
    hasOwnAdmin: boolean;
    ownSections: ModuleAdminSection[];
    scope: ActiveScope;
    setScope: ModuleAdminPageStores['setScope'];
    groups: ModuleSettingGroup[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        data: NoInfer<AdminModule[]> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<AdminModule[]>, Error>>;
        liveState: (module: AdminModule) => ModuleLiveState;
        scope: ActiveScope;
        setScope: import("react").Dispatch<import("react").SetStateAction<ActiveScope>>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        settings: {
            items: import("./ModuleAdminSettings").SettingItem[];
            isLoading: boolean;
            isError: boolean;
            refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<{
                settings: import("./ModuleAdminSettings").SettingItem[];
            }>, Error>>;
        };
        hasOwnAdmin: boolean;
        ownSections: ModuleAdminSection[];
        groups: ModuleSettingGroup[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get id(): string;
    get module(): AdminModule | null;
    get ownSlot(): import("../slots/SlotRegistry").SlotName;
    get wanted(): string;
    get active(): ModuleSettingGroup;
    get isFirst(): boolean;
    get here(): ModuleAdminSection[];
    get inline(): ModuleAdminSection[];
    get asTabs(): ModuleAdminSection[];
    get state(): ModuleLiveState;
    get paged(): boolean;
    get hasAdmin(): boolean;
    get header(): import("react").JSX.Element;
    get perUnit(): boolean;
    get scopeCallout(): import("react").JSX.Element | null;
    get configError(): import("react").JSX.Element;
    get backLink(): import("react").JSX.Element;
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_case_3(): boolean;
    get show_case_4(): boolean;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_header(): {
        children: import("react").JSX.Element;
    };
    get content_columns_group_heading_group(): {
        children: import("react").JSX.Element;
    };
    get show_main(): boolean;
    get content_header2(): {
        children: import("react").JSX.Element;
    };
    get content_columns_scope_callout_module_state_card(): {
        children: import("react").JSX.Element;
    };
    placed(section: ModuleAdminSection): string | undefined;
    backToList(): void | Promise<void>;
    columns(content: ReactNode): import("react").JSX.Element;
    empty_state_action(_sender: unknown, _args: EventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ModuleAdminPageStores = ReturnType<ModuleAdminPage['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ModuleAdminPageHooks = ReturnType<ModuleAdminPage['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
