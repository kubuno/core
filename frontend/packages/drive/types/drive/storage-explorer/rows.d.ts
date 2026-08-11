/**
 * List/details/tiles/content rows. Files AND folders expose the SAME operations
 * as the icon cards (click/Ctrl/Shift selection, checkbox, marquee, drag, menu,
 * open, keyboard cursor) so the actions are identical in every view. Both are
 * the BASE components behind the themable `drive.file-row` / `drive.folder-row`
 * keys (cf. `./themed`).
 */
import React from 'react';
import { type Folder, type FileItem } from '../api';
import type { ThumbSpec } from '../storageSource';
import { type DetailsColsView } from './detailsModel';
export declare function FileRowBase({ file, thumb, selected, preSelected, focused, canMove, mergeTop, mergeBottom, zebra, onSelect, onToggle, onContextMenu, onLongPress, onOpen, onDragStart, density, hideMeta, cols }: {
    file: FileItem;
    thumb: ThumbSpec;
    selected: boolean;
    preSelected?: boolean;
    focused?: boolean;
    canMove: boolean;
    mergeTop?: boolean;
    mergeBottom?: boolean;
    zebra?: boolean;
    onSelect: (id: string, e: React.MouseEvent) => void;
    onToggle: (id: string) => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onLongPress?: (e: React.MouseEvent) => void;
    onOpen: () => void;
    onDragStart?: (e: React.DragEvent) => void;
    density?: 'compact' | 'normal' | 'large';
    hideMeta?: boolean;
    cols?: DetailsColsView;
}): React.JSX.Element;
export declare function FolderRowBase({ folder, isDragTarget, selected, preSelected, focused, canMove, mergeTop, mergeBottom, zebra, onSelect, onToggle, onOpen, onContextMenu, onLongPress, onDragStart, onDragOver, onDragLeave, onDrop, density, cols }: {
    folder: Folder;
    isDragTarget: boolean;
    selected: boolean;
    preSelected?: boolean;
    focused?: boolean;
    canMove: boolean;
    mergeTop?: boolean;
    mergeBottom?: boolean;
    zebra?: boolean;
    onSelect: (id: string, e: React.MouseEvent) => void;
    onToggle: (id: string) => void;
    onOpen: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onLongPress?: (e: React.MouseEvent) => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    density?: 'compact' | 'normal' | 'large';
    cols?: DetailsColsView;
}): React.JSX.Element;
