/**
 * Code-behind of `Shell.kbview` (converted from `Shell.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import TitleTooltips from "./TitleTooltips";
import ModuleArea from "./ModuleArea";
import { Slot } from "../slots/SlotRegistry";
import { ViewBase } from './Shell.kbview';
export declare class Shell extends ViewBase {
    sidebarOpen: boolean;
    closeSidebar: () => void;
    headerHidden: boolean;
    location: ShellStores['location'];
    isMobileVp: boolean;
    isLandscapeVp: boolean;
    sidebarConfigs: ShellStores['sidebarConfigs'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        sidebarOpen: boolean;
        closeSidebar: () => void;
        headerHidden: boolean;
        location: import("react-router").Location<any>;
        routerNavigate: import("react-router").NavigateFunction;
        isMobileVp: boolean;
        isLandscapeVp: boolean;
        sidebarConfigs: import("../store/sidebarStore").SidebarConfig[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get isHome(): boolean;
    get mobileLandscape(): boolean;
    get activeSidebarCfg(): import("../store/sidebarStore").SidebarConfig | null;
    get hasBottomNav(): boolean;
    /** `<TitleTooltips>`, rendered by a ReactHost. */
    get TitleTooltips(): typeof TitleTooltips;
    get show_header_hidden(): boolean;
    /** `<AppHeader>`, rendered by a ReactHost. */
    get AppHeader(): import("react").FunctionComponent<Readonly<{}>>;
    /** `<GlobalMaintenanceBanner>`, rendered by a ReactHost. */
    get GlobalMaintenanceBanner(): import("react").FunctionComponent<Readonly<{}>>;
    /** `<MobileNav>`, rendered by a ReactHost. */
    get MobileNav(): import("react").FunctionComponent<Readonly<import("./MobileNav").MobileNavProps>>;
    get mobile_nav_props(): {
        variant: string;
    };
    get show_is_home(): boolean;
    /** `<AppSidebar>`, rendered by a ReactHost. */
    get AppSidebar(): import("react").FunctionComponent<Readonly<{}>>;
    /** `<LeftRail>`, rendered by a ReactHost. */
    get LeftRail(): import("react").FunctionComponent<Readonly<{}>>;
    /** `<ModuleArea>`, rendered by a ReactHost. */
    get ModuleArea(): typeof ModuleArea;
    /** `<RightPanel>`, rendered by a ReactHost. */
    get RightPanel(): import("react").FunctionComponent<Readonly<{}>>;
    /** `<RightRail>`, rendered by a ReactHost. */
    get RightRail(): import("react").FunctionComponent<Readonly<{}>>;
    get div_data(): string;
    /** `<MobileFab>`, rendered by a ReactHost. */
    get MobileFab(): import("react").FunctionComponent<Readonly<{}>>;
    get show_mobile_landscape(): boolean;
    /** `<MobileNav>`, rendered by a ReactHost. */
    get MobileNav2(): import("react").FunctionComponent<Readonly<import("./MobileNav").MobileNavProps>>;
    /** `<Slot>`, rendered by a ReactHost. */
    get Slot(): typeof Slot;
    get slot_props(): {
        name: string;
    };
    get slot_props2(): {
        name: string;
    };
    panel_click(_sender: unknown, _args: MouseEventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ShellStores = ReturnType<Shell['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
