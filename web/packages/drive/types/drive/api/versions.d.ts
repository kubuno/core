import type { FileItem, FileVersion, Folder } from './types';
/** File versioning: history, restore and per-item toggles. */
export declare const versionApi: {
    listVersions: (fileId: string) => Promise<{
        versions: FileVersion[];
    }>;
    createVersion: (fileId: string, comment?: string) => Promise<{
        version: FileVersion;
    }>;
    restoreVersion: (fileId: string, versionId: string) => Promise<{
        file: FileItem;
    }>;
    deleteVersion: (fileId: string, versionId: string) => Promise<void>;
    setFileVersioning: (fileId: string, enabled: boolean) => Promise<{
        file: FileItem;
    }>;
    setFolderVersioning: (folderId: string, enabled: boolean) => Promise<{
        folder: Folder;
    }>;
};
