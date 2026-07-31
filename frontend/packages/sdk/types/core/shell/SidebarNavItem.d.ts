import type { ReactNode } from 'react';
declare function SidebarNavItemBase({ label, icon, active, collapsed, onClick, to, end, badge, href, }: {
    label: string;
    icon: ReactNode;
    active?: boolean;
    collapsed?: boolean;
    onClick?: () => void;
    to?: string;
    end?: boolean;
    badge?: number;
    /** href of the action variant (no `to`). Defaults to '#' so it is a real link. */
    href?: string;
}): import("react").JSX.Element;
export declare const SidebarNavItem: typeof SidebarNavItemBase;
export {};
