import type { FileItem } from './types';
/** Files: listing, upload, rename/move/copy, trash and metadata. */
export declare const fileApi: {
    listFiles: (folderId?: string | null, starred?: boolean, trashed?: boolean, recent?: boolean, folderPathPrefix?: string, opts?: {
        limit?: number;
        offset?: number;
    }) => Promise<{
        files: FileItem[];
    }>;
    listFilesBySize: (limit?: number) => Promise<{
        files: FileItem[];
    }>;
    uploadFile: (file: File, folderId: string | null | undefined, onProgress?: (pct: number) => void, overwrite?: boolean) => Promise<{
        file: FileItem;
    }>;
    renameFile: (id: string, name: string, overwrite?: boolean, strict?: boolean) => Promise<{
        file: FileItem;
    }>;
    moveFile: (id: string, folderId: string | null, overwrite?: boolean, strict?: boolean) => Promise<{
        file: FileItem;
    }>;
    trashFile: (id: string) => Promise<void>;
    restoreFile: (id: string) => Promise<void>;
    deleteFile: (id: string) => Promise<void>;
    purgeTrash: () => Promise<{
        folders_deleted: number;
        files_deleted: number;
    }>;
    setOpenWith: (fileId: string, moduleId: string | null) => Promise<{
        file: FileItem;
    }>;
    updateUserMetadata: (fileId: string, data: {
        title?: string;
        description?: string;
        author?: string;
        keywords?: string[];
    }) => Promise<{
        file: FileItem;
    }>;
    starFile: (id: string) => Promise<{
        file: FileItem;
    }>;
    copyFile: (id: string, folderId: string | null) => Promise<{
        file: FileItem;
    }>;
};
