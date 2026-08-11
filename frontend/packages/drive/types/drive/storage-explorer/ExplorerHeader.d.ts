/**
 * Top bar of the explorer: breadcrumb + actions, replaced on touch by a
 * selection bar as soon as one item is ticked (long-press to enter, tap to
 * (un)tick — the mobile-app flow).
 */
import React from 'react';
import { type MenuItem } from '@ui';
import type { Folder } from '../api';
import type { TFunc } from './types';
export declare function ExplorerHeader({ mobileSelecting, selectedIds, itemTypeMap, allItemsSelected, toggleSelectAll, clearSelection, onDownloadSelection, onDeleteSelection, canDelete, hasPlayingInSelection, title, breadcrumbs, onNavigate, childFolders, onOpenChild, isMobile, canUpload, hideImport, importMenuItems, onImport, onImportMenu, canMkdir, onNewFolder, toolbarContent, t, }: {
    mobileSelecting: boolean;
    selectedIds: Set<string>;
    itemTypeMap: Map<string, 'file' | 'folder'>;
    allItemsSelected: boolean;
    toggleSelectAll: () => void;
    clearSelection: () => void;
    onDownloadSelection: () => void;
    onDeleteSelection: () => void;
    canDelete: boolean;
    hasPlayingInSelection: boolean;
    title: string;
    breadcrumbs: Array<{
        id: string;
        name: string;
    }>;
    onNavigate: (idx: number) => void;
    childFolders: Folder[];
    onOpenChild: (folder: Folder) => void;
    isMobile: boolean;
    canUpload: boolean;
    hideImport?: boolean;
    importMenuItems?: MenuItem[];
    onImport: () => void;
    onImportMenu: (e: React.MouseEvent) => void;
    canMkdir: boolean;
    onNewFolder: () => void;
    toolbarContent?: React.ReactNode;
    t: TFunc;
}): React.JSX.Element;
