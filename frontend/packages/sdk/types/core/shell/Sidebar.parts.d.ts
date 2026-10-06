import type { SidebarItem } from "../types";
import type { Sidebar } from './Sidebar';
declare function SidebarIcon({ name }: {
    name: string;
}): import("react").JSX.Element;
export { SidebarIcon };
declare function ModuleRootIcon({ moduleId, item }: {
    moduleId: string;
    item: SidebarItem;
}): import("react").JSX.Element;
export { ModuleRootIcon };
declare function SidebarLink({ item, iconOverride }: {
    item: SidebarItem;
    iconOverride?: React.ReactNode;
}): import("react").JSX.Element;
export { SidebarLink };
export declare function Part1({ closeSidebar }: {
    closeSidebar: NonNullable<Sidebar['closeSidebar']>;
}): import("react").JSX.Element;
export declare function Part2({ ActiveConfig_SidebarBody }: {
    ActiveConfig_SidebarBody: NonNullable<NonNullable<Sidebar['activeConfig']>['SidebarBody']>;
}): import("react").JSX.Element;
export declare function Part3({ activeConfig }: {
    activeConfig: NonNullable<Sidebar['activeConfig']>;
}): import("react").JSX.Element;
