import type { StorageSource } from '../storageSource';
export declare function useExplorerData({ src, caps, currentFolderId, acceptedMimeTypes, fileTypeModuleId }: {
    src: StorageSource;
    caps: StorageSource['capabilities'];
    currentFolderId: string | null;
    acceptedMimeTypes?: string[];
    fileTypeModuleId?: string;
}): {
    rootLoading: boolean;
    rootResolved: boolean;
    effectiveFolderId: string | null;
    dirKey: string;
    isLoading: boolean;
    folders: import("..").Folder[];
    files: import("..").FileItem[];
    itemTypeMap: Map<string, "file" | "folder">;
};
