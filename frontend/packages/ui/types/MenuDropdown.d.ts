import React from 'react';
export type MenuItem = {
    type: 'action';
    label: string;
    shortcut?: string;
    disabled?: boolean;
    checked?: boolean;
    danger?: boolean;
    icon?: React.ReactNode;
    onClick: () => void;
} | {
    type: 'separator';
} | {
    type: 'label';
    text: string;
} | {
    type: 'submenu';
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
    items: MenuItem[];
} | {
    type: 'custom';
    render: (close: () => void) => React.ReactNode;
};
export interface MenuDropdownPos {
    top: number;
    left: number;
    minWidth?: number;
}
export type MenuTheme = 'light' | 'dark';
interface MenuDropdownProps {
    items: MenuItem[];
    pos: MenuDropdownPos;
    onClose: () => void;
    /** Override minWidth (pos.minWidth takes precedence if set) */
    minWidth?: number;
    /** Palette : 'light' (défaut) ou 'dark' (éditeurs sombres) */
    theme?: MenuTheme;
}
export declare function MenuDropdown({ items, pos, onClose, minWidth: minWidthProp, theme }: MenuDropdownProps): React.ReactPortal;
/** Hook to manage open/closed state + positioning for a MenuDropdown trigger */
export declare function useMenuDropdown(): {
    pos: MenuDropdownPos | null;
    open: (e: React.MouseEvent | React.MouseEvent<HTMLElement>) => void;
    openAt: (x: number, y: number) => void;
    close: () => void;
    isOpen: boolean;
};
export {};
