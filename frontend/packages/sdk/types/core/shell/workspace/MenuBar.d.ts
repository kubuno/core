export type MenuItem = {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    shortcut?: string;
} | 'sep';
type MenuTheme = {
    header: string;
    panel: string;
    border: string;
    active: string;
    text: string;
    textDim: string;
};
export declare function MenuBar({ menus, C }: {
    menus: {
        label: string;
        items: MenuItem[];
    }[];
    C: MenuTheme;
}): import("react").JSX.Element;
export {};
