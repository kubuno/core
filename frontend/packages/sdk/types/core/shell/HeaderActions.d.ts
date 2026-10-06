import { Slot } from "../slots/SlotRegistry";
import AddAccountModal from "../components/AddAccountModal";
import SettingsMenu from "./SettingsMenu";
import { ViewBase } from './HeaderActions.kbview';
import * as __parts from './HeaderActions.parts';
export type HeaderActionsProps = {
    compact?: boolean;
    dark?: boolean;
    minimal?: boolean;
};
export declare class HeaderActions extends ViewBase {
    accessor addAccountOpen: boolean;
    accessor addAccountPrefill: {
        email: string;
        slot: number;
    } | undefined;
    tr: HeaderActionsStores['t'];
    activeModules: HeaderActionsStores['activeModules'];
    notifications: HeaderActionsStores['notifications'];
    unreadCount: number;
    markRead: (id: string) => void;
    markAllRead: () => void;
    navigate: HeaderActionsStores['navigate'];
    pathname: string;
    allWaffleApps: HeaderActionsStores['allWaffleApps'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        activeModules: import("../types").ActiveModule[];
        notifications: import("../store/notificationStore").AppNotification[];
        unreadCount: number;
        markRead: (id: string) => void;
        markAllRead: () => void;
        navigate: import("react-router").NavigateFunction;
        pathname: string;
        allWaffleApps: import("../registry/WaffleAppRegistry").WaffleApp[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get compact(): boolean;
    get dark(): boolean;
    get minimal(): boolean;
    get activeIds(): Set<string>;
    get SettingsButtonOverride(): import("react").ComponentType<{
        compact?: boolean;
        dark?: boolean;
    }> | null;
    get isHome(): boolean;
    get ico(): 18;
    get btn(): string;
    get show_minimal(): boolean;
    /** `<Slot>`, rendered by a ReactHost. */
    get Slot(): typeof Slot;
    get slot_props(): {
        name: string;
    };
    get slot_props2(): {
        name: string;
        dark: boolean;
        compact: boolean;
    };
    get part1_props(): {
        btn: string;
        t: import("i18next").TFunction<"translation", undefined>;
        ico: 18;
        unreadCount: number;
        markAllRead: () => void;
        notifications: import("../store/notificationStore").AppNotification[];
        markRead: (id: string) => void;
        navigate: import("react-router").NavigateFunction;
    };
    /** A part of the screen still written in React (<DropdownMenu.Root> is no .kbview element (a local or dynamic component)). */
    get Part1(): typeof __parts.Part1;
    get show_not_is_home(): boolean;
    get show_settings_button_override(): boolean;
    get show_not_settings_button_override(): boolean;
    get part2_props(): {
        SettingsButtonOverride: import("react").ComponentType<{
            compact?: boolean;
            dark?: boolean;
        }>;
        compact: boolean;
        dark: boolean;
    };
    /** A part of the screen still written in React (<SettingsButtonOverride> is no .kbview element (a local or dynamic component)). */
    get Part2(): typeof __parts.Part2;
    /** `<SettingsMenu>`, rendered by a ReactHost. */
    get SettingsMenu(): typeof SettingsMenu;
    get settings_menu_props(): {
        triggerClassName: string;
        iconSize: 18;
        ariaLabel: string;
    };
    get visible(): boolean;
    get visible2(): boolean;
    get part3_props(): {
        btn: string;
        ico: 18;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<DropdownMenu.Root> is no .kbview element (a local or dynamic component)). */
    get Part3(): typeof __parts.Part3;
    get visible3(): boolean;
    get visible4(): boolean;
    /** `<WaffleButton>`, rendered by a ReactHost. */
    get WaffleButton(): import("@kubuno/views").DefinedControl<import("./menus/WaffleButton").WaffleButtonProps>;
    get waffle_button_props(): {
        allApps: import("../registry/WaffleAppRegistry").WaffleApp[];
        compact: boolean;
        dark: boolean;
    };
    /** `<AccountButton>`, rendered by a ReactHost. */
    get AccountButton(): import("@kubuno/views").DefinedControl<import("./menus/AccountButton").AccountButtonProps>;
    get account_button_props(): import("./menus/AccountButton").AccountButtonProps;
    /** `<AddAccountModal>`, rendered by a ReactHost. */
    get AddAccountModal(): typeof AddAccountModal;
    get add_account_modal_props(): import("../components/AddAccountModal").Props;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type HeaderActionsStores = ReturnType<HeaderActions['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<HeaderActionsProps>>;
export default _default;
