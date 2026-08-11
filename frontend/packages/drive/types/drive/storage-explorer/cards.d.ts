/**
 * Icon-view cards: a folder chip and a file card (thumbnail + extension badge).
 * Both are the BASE components behind the themable `drive.folder-card` /
 * `drive.file-card` keys (cf. `./themed`).
 */
import React from 'react';
import type { Folder, FileItem } from '../api';
import type { ThumbSpec } from '../storageSource';
export declare function FolderCardBase({ folder, isDragTarget, selected, preSelected, focused, canMove, onSelect, onToggle, onOpen, onContextMenu, onLongPress, onDragStart, onDragOver, onDragLeave, onDrop }: {
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
}): React.JSX.Element;
export declare function FileCardBase({ file, thumb, selected, preSelected, focused, canMove, allowVideoPreview, onSelect, onToggle, onContextMenu, onLongPress, onDragStart, onOpen, thumbH, iconScale, dense }: {
    file: FileItem;
    thumb: ThumbSpec;
    selected: boolean;
    preSelected?: boolean;
    focused?: boolean;
    canMove: boolean;
    allowVideoPreview: boolean;
    onSelect: (id: string, e: React.MouseEvent) => void;
    onToggle: (id: string) => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onLongPress?: (e: React.MouseEvent) => void;
    onDragStart: (e: React.DragEvent) => void;
    onOpen: () => void;
    thumbH?: number;
    iconScale?: number;
    dense?: boolean;
}): React.JSX.Element;
