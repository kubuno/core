import type React from 'react';
import type { Folder, FileItem } from '../api';
import type { StorageSource } from '../storageSource';
import type { ExternalDragItem } from '../StorageExplorer';
export declare function useExplorerDnd({ src, caps, effectiveFolderId, selectedIds, itemTypeMap, folders, files, invalidate, importEntries, importFiles, onExternalDrop }: {
    src: StorageSource;
    caps: StorageSource['capabilities'];
    effectiveFolderId: string | null;
    selectedIds: Set<string>;
    itemTypeMap: Map<string, 'file' | 'folder'>;
    folders: Folder[];
    files: FileItem[];
    invalidate: () => void;
    importEntries: (entries: FileSystemEntry[], targetId: string | null) => Promise<void>;
    importFiles: (files: File[], targetId: string | null) => Promise<void>;
    onExternalDrop?: (payload: ExternalDragItem, targetParentId: string | null) => void;
}): {
    isDragOver: boolean;
    dragOverFolderId: string | null;
    setDragOverFolderId: React.Dispatch<React.SetStateAction<string | null>>;
    setDraggingItem: React.Dispatch<React.SetStateAction<{
        type: "folder" | "file";
        id: string;
    } | null>>;
    handleDragEnter: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent, targetFolderId?: string | null) => void;
};
