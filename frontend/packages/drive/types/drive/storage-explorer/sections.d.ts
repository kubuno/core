/**
 * The item area itself: the folders section, the files section (both switching
 * layout on the active `ViewMode`) and the Windows-Explorer-like details table.
 * Every layout reuses the SAME row/card props bag, so the operations
 * (selection/checkbox/marquee/drag/menu/open/cursor) are identical in all views.
 */
import React from 'react';
import type { Folder, FileItem } from '../api';
import type { ThumbSpec } from '../storageSource';
import { type ViewMode } from '../fileView';
import type { DetailsColsView, DetailsSettings, DetailsSortField } from './detailsModel';
import type { TFunc } from './types';
/** Props shared by every folder rendering (card or row), whatever the view. */
export type FolderCommonProps = {
    folder: Folder;
    isDragTarget: boolean;
    selected: boolean;
    preSelected?: boolean;
    focused?: boolean;
    canMove: boolean;
    onSelect: (id: string, e: React.MouseEvent) => void;
    onToggle: (id: string) => void;
    onOpen: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onLongPress?: (e: React.MouseEvent) => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
};
/** Props shared by every file rendering (card or row), whatever the view. */
export type FileCommonProps = {
    file: FileItem;
    thumb: ThumbSpec;
    selected: boolean;
    preSelected?: boolean;
    focused?: boolean;
    canMove: boolean;
    onSelect: (id: string, e: React.MouseEvent) => void;
    onToggle: (id: string) => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onLongPress?: (e: React.MouseEvent) => void;
    onDragStart: (e: React.DragEvent) => void;
    onOpen: () => void;
};
export declare function FoldersSection({ visibleFolders, view, compact, isMobile, selectedIds, folderRowProps, t }: {
    visibleFolders: Folder[];
    view: ViewMode;
    compact: boolean;
    isMobile: boolean;
    selectedIds: Set<string>;
    folderRowProps: (f: Folder) => FolderCommonProps;
    t: TFunc;
}): React.JSX.Element;
export declare function FilesSection({ visibleFiles, filteredFiles, files, typeFilter, view, compact, isMobile, selectedIds, fileRowProps, renderFileCard, allowVideoPreview, t }: {
    visibleFiles: FileItem[];
    filteredFiles: FileItem[];
    files: FileItem[];
    typeFilter: string | null;
    view: ViewMode;
    compact: boolean;
    isMobile: boolean;
    selectedIds: Set<string>;
    fileRowProps: (f: FileItem) => FileCommonProps;
    renderFileCard?: (file: FileItem, defaultCard: React.ReactNode) => React.ReactNode;
    allowVideoPreview: boolean;
    t: TFunc;
}): React.JSX.Element;
export declare function DetailsTable({ visibleFolders, visibleFiles, selectedIds, folderRowProps, fileRowProps, details, onDetails, detailsView, sortField, sortDir, onSortField, onSortDir, onHeaderMenu }: {
    visibleFolders: Folder[];
    visibleFiles: FileItem[];
    selectedIds: Set<string>;
    folderRowProps: (f: Folder) => FolderCommonProps;
    fileRowProps: (f: FileItem) => FileCommonProps;
    details: DetailsSettings;
    onDetails: (updater: (s: DetailsSettings) => DetailsSettings) => void;
    detailsView: DetailsColsView;
    sortField: DetailsSortField;
    sortDir: 'asc' | 'desc';
    onSortField: (f: DetailsSortField) => void;
    onSortDir: (d: 'asc' | 'desc') => void;
    onHeaderMenu: (e: React.MouseEvent) => void;
}): React.JSX.Element;
