/**
 * Top bar of the explorer: breadcrumb + actions, replaced on touch by a
 * selection bar as soon as one item is ticked (long-press to enter, tap to
 * (un)tick — the mobile-app flow).
 */
import React from 'react';
import type { TFunc } from './types';
export declare function ExplorerHeader({ mobileSelecting, selectedIds, itemTypeMap, allItemsSelected, toggleSelectAll, clearSelection, onDownloadSelection, onDeleteSelection, canDelete, hasPlayingInSelection, title, breadcrumbs, onNavigate, onFolderMenu, viewControls, toolbarContent, t, }: {
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
    onFolderMenu?: (e: React.MouseEvent) => void;
    /** View switcher, shown on the trail's line. */
    viewControls?: React.ReactNode;
    toolbarContent?: React.ReactNode;
    t: TFunc;
}): React.JSX.Element;
