/**
 * Code-behind of `AppHeader.kbview` (converted from `AppHeader.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { Slot } from "../slots/SlotRegistry";
import { ViewBase } from './AppHeader.kbview';
import * as __parts from './AppHeader.parts';
export declare class AppHeader extends ViewBase {
    accessor searchOpen: boolean;
    tr: AppHeaderStores['t'];
    toggleSidebar: () => void;
    toggleSidebarCollapsed: () => void;
    sidebarCollapsed: boolean;
    pathname: string;
    isMobile: boolean;
    searchConfigs: AppHeaderStores['searchConfigs'];
    overlayRef: AppHeaderStores['overlayRef'];
    openSignal: AppHeaderStores['openSignal'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        toggleSidebar: () => void;
        toggleSidebarCollapsed: () => void;
        sidebarCollapsed: boolean;
        pathname: string;
        isMobile: boolean;
        searchConfigs: import("../store/searchStore").SearchConfig[];
        overlayRef: import("react").RefObject<HTMLDivElement | null>;
        openSignal: import("../store/searchStore").SearchOpenSignal;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {};
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get isHome(): boolean;
    get inlineSearch(): boolean;
    get show_is_home(): boolean;
    get accessible_name(): string;
    /** `<BrandLink>`, rendered by a ReactHost. */
    get BrandLink(): import("react").FunctionComponent<Readonly<import("./BrandLink").BrandLinkProps>>;
    get show_not_inline_search(): boolean;
    /** `<SearchBar>`, rendered by a ReactHost. */
    get SearchBar(): ({ dark, compact }: {
        dark?: boolean;
        compact?: boolean;
    }) => import("react").JSX.Element;
    /** `<Slot>`, rendered by a ReactHost. */
    get Slot(): typeof Slot;
    get slot_props(): {
        name: string;
    };
    /** `<HealthTopbarChip>`, rendered by a ReactHost. */
    get HealthTopbarChip(): import("react").FunctionComponent<Readonly<{}>>;
    get show_inline_search(): boolean;
    /** `<HeaderActions>`, rendered by a ReactHost. */
    get HeaderActions(): import("react").FunctionComponent<Readonly<import("./HeaderActions").HeaderActionsProps>>;
    get show_search_open_inline_search(): boolean;
    get part1_props(): {
        overlayRef: import("react").RefObject<HTMLDivElement | null>;
        setSearchOpen: (value: AppHeader["searchOpen"] | ((prev: AppHeader["searchOpen"]) => AppHeader["searchOpen"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<div ref>: attribute(s) without a .kbview property). */
    get Part1(): typeof __parts.Part1;
    panel_click(_sender: unknown, _args: MouseEventArgs): void;
    panel_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    panel_click3(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setSearchOpen` of the TSX: a value, or an update of the previous one. */
    setSearchOpen(value: AppHeader['searchOpen'] | ((prev: AppHeader['searchOpen']) => AppHeader['searchOpen'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AppHeaderStores = ReturnType<AppHeader['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type AppHeaderHooks = ReturnType<AppHeader['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
