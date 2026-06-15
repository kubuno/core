import { type MenuItem as RichMenuItem } from '@ui';
export type WsMenu = {
    label: string;
    items: RichMenuItem[];
};
export interface WorkspaceMenuActions {
    onNew?: () => void;
    newLabel?: string;
    onOpen?: () => void;
    onDuplicate?: () => void;
    downloadItems?: RichMenuItem[];
    onRename?: () => void;
    onDetails?: () => void;
    detailsLabel?: string;
    onUndo?: () => void;
    canUndo?: boolean;
    onRedo?: () => void;
    canRedo?: boolean;
    onCut?: () => void;
    onCopy?: () => void;
    onPaste?: () => void;
    onFindReplace?: () => void;
}
export declare function buildWorkspaceMenus(opts: {
    t: (k: string, o?: {
        defaultValue: string;
    }) => string;
    actions?: WorkspaceMenuActions;
    onTrash?: () => void;
    onFullscreen: () => void;
    onAbout: () => void;
    extraMenus?: WsMenu[];
}): WsMenu[];
export declare function WorkspaceMenuBar({ menus, dark }: {
    menus: WsMenu[];
    dark?: boolean;
}): import("react").JSX.Element;
export type { RichMenuItem };
