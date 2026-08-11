/**
 * Import side of the explorer: tracked uploads, the shared conflict pipeline
 * (any imported file OR folder whose name already exists prompts the user —
 * overwrite / keep both / cancel, at any depth), the hidden <input> triggers and
 * the « Nouveau dossier » entry point (rich modal or prompt).
 */
import { type ChangeEvent } from 'react';
import type { UploadEntry } from '../store';
import type { StorageSource } from '../storageSource';
import type { TFunc } from './types';
export declare function useExplorerImport({ src, caps, effectiveFolderId, invalidate, t, addUpload, updateUpload, onRegisterActions }: {
    src: StorageSource;
    caps: StorageSource['capabilities'];
    effectiveFolderId: string | null;
    invalidate: () => void;
    t: TFunc;
    addUpload: (entry: UploadEntry) => void;
    updateUpload: (id: string, patch: Partial<UploadEntry>) => void;
    onRegisterActions?: (a: {
        importFiles: () => void;
        importFolder: () => void;
        newFolder: () => void;
    }) => void;
}): {
    fileInputRef: import("react").RefObject<HTMLInputElement | null>;
    folderInputRef: import("react").RefObject<HTMLInputElement | null>;
    handleFileInput: (e: ChangeEvent<HTMLInputElement>) => void;
    handleFolderInput: (e: ChangeEvent<HTMLInputElement>) => void;
    openNewFolder: () => void;
    newFolderOpen: boolean;
    setNewFolderOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    importFiles: (files: File[], targetId: string | null) => Promise<void>;
    importEntries: (entries: FileSystemEntry[], targetId: string | null) => Promise<void>;
    conflictDialog: import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | null;
};
