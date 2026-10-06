import { Slot } from "../slots/SlotRegistry";
import type { SidebarItem } from "../types";
import { ViewBase } from './Sidebar.kbview';
import * as __parts from './Sidebar.parts';
export declare class Sidebar extends ViewBase {
    pathname: string;
    activeModules: SidebarStores['activeModules'];
    configs: SidebarStores['configs'];
    sidebarOpen: boolean;
    closeSidebar: () => void;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        pathname: string;
        activeModules: import("../types").ActiveModule[];
        configs: import("../store/sidebarStore").SidebarConfig[];
        sidebarOpen: boolean;
        closeSidebar: () => void;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get activeConfig(): import("../store/sidebarStore").SidebarConfig | null;
    get activeModule(): import("../types").ActiveModule | null | undefined;
    get moduleItems(): SidebarItem[];
    get moduleRootItems(): (SidebarItem & {
        _moduleId: string;
    })[];
    get hasNewActions(): boolean;
    get aside_class(): string;
    get show_active_config(): boolean;
    get show_not_active_config(): boolean;
    get part1_props(): {
        closeSidebar: () => void;
    };
    /** A part of the screen still written in React (<NavLink> is no .kbview element (react-router-dom#NavLink)). */
    get Part1(): typeof __parts.Part1;
    get show_active_config_sidebar_body(): boolean;
    get show_not_active_config_sidebar_body(): boolean;
    get part2_props(): {
        ActiveConfig_SidebarBody: import("react").ComponentType<{
            collapsed?: boolean;
        }>;
    };
    /** A part of the screen still written in React (<activeConfig.SidebarBody> is no .kbview element (a local or dynamic component)). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        activeConfig: import("../store/sidebarStore").SidebarConfig;
    };
    /** A part of the screen still written in React (<DropdownMenu.Root> is no .kbview element (a local or dynamic component)). */
    get Part3(): typeof __parts.Part3;
    /** `<SidebarLink>`, rendered by a ReactHost. */
    get SidebarLink(): typeof __parts.SidebarLink;
    /** The rows of the Repeater over `moduleItems`. */
    get rows_module_items(): {
        item: SidebarItem;
        sidebar_link_props: {
            item: SidebarItem;
        } | undefined;
        key: string;
    }[];
    get visible(): boolean;
    get visible2(): boolean;
    get visible3(): boolean;
    get visible4(): boolean;
    /** `<SidebarLink>`, rendered by a ReactHost. */
    get SidebarLink2(): typeof __parts.SidebarLink;
    get sidebar_link_props(): {
        item: {
            id: string;
            label: string;
            icon: string;
            path: string;
            position: number;
        };
    };
    get show_module_root_items(): boolean;
    /** The rows of the Repeater over `moduleRootItems`. */
    get rows_module_root_items(): {
        item: SidebarItem & {
            _moduleId: string;
        };
        sidebar_link_props: {
            item: SidebarItem & {
                _moduleId: string;
            };
            iconOverride: import("react").JSX.Element;
        } | undefined;
        key: string;
    }[];
    /** `<Slot>`, rendered by a ReactHost. */
    get Slot(): typeof Slot;
    get slot_props(): {
        name: string;
    };
    get slot_props2(): {
        name: string;
    };
}
/** What `useStores()` gives (the types of the fields it fills). */
export type SidebarStores = ReturnType<Sidebar['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
