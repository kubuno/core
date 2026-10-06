import type { Folder, FolderAncestor, FolderSize } from './types';
/** Folder tree: listing, CRUD, trash, star and colour. */
export declare const folderApi: {
    listFolders: (parentId?: string | null, trashed?: boolean) => Promise<{
        folders: Folder[];
    }>;
    trashFolder: (id: string) => Promise<{
        folder: Folder;
    }>;
    restoreFolder: (id: string) => Promise<{
        folder: Folder;
    }>;
    getFolder: (id: string) => Promise<{
        folder: Folder;
        ancestors: FolderAncestor[];
    }>;
    createFolder: (name: string, parentId?: string | null) => Promise<{
        folder: Folder;
    }>;
    renameFolder: (id: string, name: string, overwrite?: boolean, strict?: boolean) => Promise<{
        folder: Folder;
    }>;
    moveFolder: (id: string, parentId: string | null, overwrite?: boolean, strict?: boolean) => Promise<{
        folder: Folder;
    }>;
    deleteFolder: (id: string) => Promise<void>;
    starFolder: (id: string) => Promise<{
        folder: Folder;
    }>;
    setFolderColor: (id: string, color: string | null) => Promise<{
        folder: Folder;
    }>;
    listFoldersBySize: (limit?: number) => Promise<{
        folders: FolderSize[];
    }>;
};
