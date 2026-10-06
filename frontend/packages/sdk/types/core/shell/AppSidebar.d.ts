import { type NewActionsProvider } from "../registry/newActions";
import type { SidebarItem } from "../types";
import { ViewBase } from './AppSidebar.kbview';
import * as __parts from './AppSidebar.parts';
export declare class AppSidebar extends ViewBase {
    accessor dragging: boolean;
    tc: AppSidebarStores['tc'];
    sidebarItems: SidebarItem[];
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;
    sidebarWidth: number;
    headerHidden: boolean;
    configs: AppSidebarStores['configs'];
    pathname: string;
    isMobile: boolean;
    newMenu: AppSidebarStores['newMenu'];
    dragStart: AppSidebarStores['dragStart'];
    onResizeDown: (e: React.PointerEvent) => void;
    onResizeMove: (e: React.PointerEvent) => void;
    endResize: (e: React.PointerEvent) => void;
    loadedVersion: number;
    newProviders: NewActionsProvider[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        tc: import("i18next").TFunction<"translation", undefined>;
        sidebarItems: SidebarItem[];
        sidebarOpen: boolean;
        sidebarCollapsed: boolean;
        sidebarWidth: number;
        setSidebarWidth: (v: number) => void;
        headerHidden: boolean;
        configs: import("../store/sidebarStore").SidebarConfig[];
        pathname: string;
        isMobile: boolean;
        newMenu: {
            pos: import("@ui").MenuDropdownPos | null;
            open: (e: React.MouseEvent | React.MouseEvent<HTMLElement>) => void;
            openAt: (x: number, y: number) => void;
            close: () => void;
            isOpen: boolean;
        };
        dragStart: import("react").RefObject<{
            x: number;
            w: number;
        } | null>;
        onResizeMove: (e: React.PointerEvent) => void;
        loadedVersion: number;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        onResizeDown: (e: React.PointerEvent) => void;
        endResize: (e: React.PointerEvent) => void;
        newProviders: NewActionsProvider[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get activeConfig(): import("../store/sidebarStore").SidebarConfig | null;
    get moduleRoots(): Set<string>;
    get allMain(): SidebarItem[];
    get allSecondary(): SidebarItem[];
    get mainItems(): SidebarItem[];
    get secondaryItems(): SidebarItem[];
    get showNewButton(): boolean;
    get newButtonLabel(): string;
    get bodyEmpty(): boolean;
    get forceCollapsed(): boolean;
    get collapsed(): boolean;
    get resizable(): boolean;
    get widthStyle(): {
        width: number;
    } | undefined;
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_main(): boolean;
    get part1_props(): {
        activeConfig: import("../store/sidebarStore").SidebarConfig | null;
        dragging: boolean;
        sidebarOpen: boolean;
        collapsed: boolean;
        widthStyle: {
            width: number;
        } | undefined;
        headerHidden: boolean;
        showNewButton: boolean;
        newMenu: {
            pos: import("@ui").MenuDropdownPos | null;
            open: (e: React.MouseEvent | React.MouseEvent<HTMLElement>) => void;
            openAt: (x: number, y: number) => void;
            close: () => void;
            isOpen: boolean;
        };
        newButtonLabel: string;
        newProviders: NewActionsProvider[];
        newMenu_pos: import("@ui").MenuDropdownPos | null;
        ActiveConfig_SidebarBody: import("react").ComponentType<{
            collapsed?: boolean;
        }> | undefined;
        mainItems: SidebarItem[];
        secondaryItems: SidebarItem[];
    };
    /** A part of the screen still written in React (<aside> with a computed style). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        tc: import("i18next").TFunction<"translation", undefined>;
        onResizeDown: (e: React.PointerEvent) => void;
        onResizeMove: (e: React.PointerEvent) => void;
        endResize: (e: React.PointerEvent) => void;
        dragging: boolean;
    };
    /** A part of the screen still written in React (<div aria-orientation onPointerDown onPointerMove onPointerUp onPointerCancel onLostPointerCapture>: attribute(s) without a .kbview property). */
    get Part2(): typeof __parts.Part2;
    filterItems(items: AppSidebar['allMain']): SidebarItem[];
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AppSidebarStores = ReturnType<AppSidebar['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type AppSidebarHooks = ReturnType<AppSidebar['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
