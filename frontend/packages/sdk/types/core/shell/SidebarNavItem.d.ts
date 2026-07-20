import type { ReactNode } from 'react';
declare function SidebarNavItemBase({ label, icon, active, collapsed, onClick, to, end, badge, }: {
    label: string;
    icon: ReactNode;
    active?: boolean;
    collapsed?: boolean;
    onClick?: () => void;
    to?: string;
    end?: boolean;
    badge?: number;
}): import("react").JSX.Element;
export declare const SidebarNavItem: typeof SidebarNavItemBase;
export {};
