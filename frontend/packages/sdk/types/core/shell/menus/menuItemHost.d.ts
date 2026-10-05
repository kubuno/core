/**
 * What makes an element an item of the menu hosting a shell control. Platform chrome stays outside the user
 * controls (vskubuno `docs/SHELL-CONTROLS.md`): the web host that shows `WaffleMenu` in a Radix menu provides
 * `DropdownMenu.Item asChild` here, so the tiles and links are menu items (roles, arrow keys, close on
 * select); rendered anywhere else (the designer, a page) they stay plain links.
 */
import { type ReactElement, type ReactNode } from 'react';
export type MenuItemHost = (element: ReactElement) => ReactNode;
export declare const MenuItemHostContext: import("react").Context<MenuItemHost>;
export declare function useMenuItemHost(): MenuItemHost;
