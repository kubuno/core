import React from 'react';
interface ContextMenuCtx {
    close: () => void;
}
export declare const useContextMenu: () => ContextMenuCtx;
/** @deprecated The background context menu is DATA now: contribute `MenuItem[]`
 *  to the `shell.context-menu-items` extension point (see `registry/contextMenu.ts`)
 *  and the shell renders them with @ui's MenuDropdown. Kept exported so the
 *  published SDK surface stays unbroken; no longer rendered by the provider. */
export declare function ContextMenuItem({ onClick, icon, label, }: {
    onClick: () => void;
    icon?: React.ReactNode;
    label: string;
}): React.JSX.Element;
/** @deprecated Use `{ type: 'separator' }` in the contributed `MenuItem[]`. */
export declare function ContextMenuSeparator(): React.JSX.Element;
export declare function ContextMenuProvider({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export {};
