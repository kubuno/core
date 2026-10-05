/**
 * `MenuLink` — a link that is an item of the menu hosting the view (web custom control). In the shell's
 * menus (the `WaffleMenu`'s « Plus de modules ») it must be reachable with the menu's arrow keys and close
 * the menu when chosen like the tiles: the host's `MenuItemHostContext` makes it a menu item; anywhere else
 * it is a plain link. A plain click stays in the app (its `OnClick` decides where to go); a middle or
 * modified click opens `Href` in a new tab.
 */
import { type MouseEvent } from 'react';
export interface MenuLinkProps {
    text?: string;
    href?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}
export declare const MenuLink: import("@kubuno/views").DefinedControl<MenuLinkProps & import("react").RefAttributes<HTMLAnchorElement>>;
