import type { SidebarItem } from "../types";
import type { AppSidebar } from './AppSidebar';
declare function SidebarIcon({ name }: {
    name: string;
}): import("react").JSX.Element;
export { SidebarIcon };
declare function SidebarLink({ item, collapsed }: {
    item: SidebarItem;
    collapsed: boolean;
}): import("react").JSX.Element;
export { SidebarLink };
declare function PlusIcon(): import("react").JSX.Element;
export { PlusIcon };
export declare function Part1({ activeConfig, dragging, sidebarOpen, collapsed, widthStyle, headerHidden, showNewButton, newMenu, newButtonLabel, newProviders, newMenu_pos, ActiveConfig_SidebarBody, mainItems, secondaryItems }: {
    activeConfig: NonNullable<AppSidebar['activeConfig']>;
    dragging: NonNullable<AppSidebar['dragging']>;
    sidebarOpen: NonNullable<AppSidebar['sidebarOpen']>;
    collapsed: NonNullable<AppSidebar['collapsed']>;
    widthStyle: AppSidebar['widthStyle'];
    headerHidden: NonNullable<AppSidebar['headerHidden']>;
    showNewButton: NonNullable<AppSidebar['showNewButton']>;
    newMenu: NonNullable<AppSidebar['newMenu']>;
    newButtonLabel: NonNullable<AppSidebar['newButtonLabel']>;
    newProviders: NonNullable<AppSidebar['newProviders']>;
    newMenu_pos: NonNullable<NonNullable<AppSidebar['newMenu']>['pos']>;
    ActiveConfig_SidebarBody: NonNullable<NonNullable<AppSidebar['activeConfig']>['SidebarBody']>;
    mainItems: NonNullable<AppSidebar['mainItems']>;
    secondaryItems: NonNullable<AppSidebar['secondaryItems']>;
}): import("react").JSX.Element;
export declare function Part2({ tc, onResizeDown, onResizeMove, endResize, dragging }: {
    tc: NonNullable<AppSidebar['tc']>;
    onResizeDown: NonNullable<AppSidebar['onResizeDown']>;
    onResizeMove: NonNullable<AppSidebar['onResizeMove']>;
    endResize: NonNullable<AppSidebar['endResize']>;
    dragging: NonNullable<AppSidebar['dragging']>;
}): import("react").JSX.Element;
