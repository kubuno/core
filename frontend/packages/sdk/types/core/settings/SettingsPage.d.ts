/**
 * Code-behind of `SettingsPage.kbview` (converted from `SettingsPage.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { Slot } from "../slots/SlotRegistry";
import { MobileSettingsIndex, type Tab } from "./navigation";
import { ApiTokensTab } from "./sections/ApiTokensTab";
import { MyDataTab } from "./sections/my-data/MyDataTab";
import { ViewBase } from './SettingsPage.kbview';
export declare class SettingsPage extends ViewBase {
    tr: SettingsPageStores['t'];
    params: SettingsPageStores['params'];
    navigate: SettingsPageStores['navigate'];
    isMobile: SettingsPageStores['isMobile'];
    nav: SettingsPageStores['nav'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        params: URLSearchParams;
        navigate: import("react-router").NavigateFunction;
        isMobile: boolean;
        nav: import("./navigation").NavItem[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get rawTab(): string | null;
    get tab(): Tab;
    get current(): import("./navigation").NavItem | undefined;
    get show_case_1(): boolean;
    /** `<MobileSettingsIndex>`, rendered by a ReactHost. */
    get MobileSettingsIndex(): typeof MobileSettingsIndex;
    get show_main(): boolean;
    get show_not_is_mobile(): boolean;
    get span_text(): string;
    get h1_text(): string;
    get show_tab_profile(): boolean;
    /** `<ProfileTab>`, rendered by a ReactHost. */
    get ProfileTab(): import("react").FunctionComponent<Readonly<{}>>;
    get show_tab_notifications(): boolean;
    /** `<NotificationsTab>`, rendered by a ReactHost. */
    get NotificationsTab(): import("react").FunctionComponent<Readonly<{}>>;
    get show_tab_themes(): boolean;
    /** `<ThemesTab>`, rendered by a ReactHost. */
    get ThemesTab(): import("react").FunctionComponent<Readonly<{}>>;
    get show_tab_clients(): boolean;
    /** `<ClientsTab>`, rendered by a ReactHost. */
    get ClientsTab(): import("react").FunctionComponent<Readonly<{}>>;
    get show_tab_security(): boolean;
    /** `<SecurityTab>`, rendered by a ReactHost. */
    get SecurityTab(): import("react").FunctionComponent<Readonly<{}>>;
    get show_tab_sessions(): boolean;
    /** `<SessionsTab>`, rendered by a ReactHost. */
    get SessionsTab(): import("react").FunctionComponent<Readonly<{}>>;
    get show_tab_api_tokens(): boolean;
    /** `<ApiTokensTab>`, rendered by a ReactHost. */
    get ApiTokensTab(): typeof ApiTokensTab;
    get show_tab_my_data(): boolean;
    /** `<MyDataTab>`, rendered by a ReactHost. */
    get MyDataTab(): typeof MyDataTab;
    get show_is_mobile(): boolean;
    /** `<Slot>`, rendered by a ReactHost. */
    get Slot(): typeof Slot;
    get slot_props(): {
        name: string;
    };
    panel_click(_sender: unknown, _args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type SettingsPageStores = ReturnType<SettingsPage['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
