import type { FileItem, Folder, FolderAncestor } from './types';
export declare const SYSTEM_ROOT_ID = "00000000-0000-0000-0000-0000000005a1";
export declare const systemApi: {
    listFolders: (parentId?: string | null) => Promise<{
        folders: Folder[];
    }>;
    listFiles: (folderId?: string | null) => Promise<{
        files: FileItem[];
    }>;
    getFolder: (id: string) => Promise<{
        folder: Folder;
        ancestors: FolderAncestor[];
    }>;
    createFolder: (name: string, parentId?: string | null) => Promise<{
        folder: Folder;
    }>;
    uploadFile: (file: File, folderId: string | null | undefined, onProgress?: (pct: number) => void, overwrite?: boolean) => Promise<{
        file: FileItem;
    }>;
    deleteFolder: (id: string) => Promise<void>;
    deleteFile: (id: string) => Promise<void>;
    downloadUrl: (id: string) => string;
    downloadBlob: (id: string) => Promise<Blob>;
};
