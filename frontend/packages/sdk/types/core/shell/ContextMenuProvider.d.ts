import React from 'react';
interface ContextMenuCtx {
    close: () => void;
}
export declare const useContextMenu: () => ContextMenuCtx;
export declare function ContextMenuItem({ onClick, icon, label, }: {
    onClick: () => void;
    icon?: React.ReactNode;
    label: string;
}): React.JSX.Element;
export declare function ContextMenuSeparator(): React.JSX.Element;
export declare function ContextMenuProvider({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export {};
