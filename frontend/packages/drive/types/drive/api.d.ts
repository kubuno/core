export * from './api/types';
export { formatSize } from './api/format';
export { SYSTEM_ROOT_ID, systemApi } from './api/system';
export { recentApi } from './api/recent';
export type { RecentFile } from './api/recent';
/** Single flat API object consumed across the host and every file-backed module. */
export declare const filesApi: {
    listRemotes: () => Promise<import("./api").RemoteConnection[]>;
    createRemote: (dto: import("./api").CreateRemoteDto) => Promise<{
        id: string;
        mount_name: string;
    }>;
    deleteRemote: (id: string) => Promise<void>;
    testRemote: (id: string) => Promise<import("./api").TestRemoteResult>;
    browseRemote: (id: string, path: string) => Promise<import("./api").RemoteEntry[]>;
    deleteRemoteEntry: (id: string, path: string) => Promise<void>;
    renameRemoteEntry: (id: string, path: string, to: string) => Promise<void>;
    createRemoteDir: (id: string, path: string) => Promise<void>;
    uploadRemoteFile: (id: string, path: string, data: Blob | File) => Promise<void>;
    fetchRemoteFileBlob: (id: string, path: string) => Promise<Blob>;
    downloadRemoteFile: (id: string, path: string, fileName: string) => Promise<void>;
    getFileActivity: (id: string) => Promise<{
        activities: import("./api").ActivityEntry[];
    }>;
    getFolderActivity: (id: string) => Promise<{
        activities: import("./api").ActivityEntry[];
    }>;
    getUserActivity: (limit?: number) => Promise<import("./api").ActivityFeedEntry[]>;
    getFileInfoExtra: (id: string) => Promise<import("./api").InfoExtra>;
    getFolderInfoExtra: (id: string) => Promise<import("./api").InfoExtra>;
    listVersions: (fileId: string) => Promise<{
        versions: import("./api").FileVersion[];
    }>;
    createVersion: (fileId: string, comment?: string) => Promise<{
        version: import("./api").FileVersion;
    }>;
    restoreVersion: (fileId: string, versionId: string) => Promise<{
        file: import("./api").FileItem;
    }>;
    deleteVersion: (fileId: string, versionId: string) => Promise<void>;
    setFileVersioning: (fileId: string, enabled: boolean) => Promise<{
        file: import("./api").FileItem;
    }>;
    setFolderVersioning: (folderId: string, enabled: boolean) => Promise<{
        folder: import("./api").Folder;
    }>;
    thumbnailUrl: (id: string) => string;
    downloadUrl: (id: string) => string;
    downloadBlob: (id: string) => Promise<Blob>;
    listShares: () => Promise<{
        shares: import("./api").Share[];
    }>;
    createShare: (opts: import("./api").CreateShareOptions) => Promise<{
        share: import("./api").Share;
    }>;
    searchRecipients: (q: string, limit?: number) => Promise<import("./api").Recipient[]>;
    revokeShare: (id: string) => Promise<void>;
    revokeAccess: (shareId: string) => Promise<void>;
    compressSave: (fileIds: string[], folderIds: string[], archiveName?: string, folderId?: string | null) => Promise<{
        file: import("./api").FileItem;
    }>;
    decompress: (fileId: string, folderId?: string | null, createSubfolder?: boolean) => Promise<{
        extracted: number;
        folder_id: string | null;
    }>;
    listArchive: (fileId: string, path?: string) => Promise<{
        entries: import("./api").ArchiveEntry[];
        path: string;
        total: number;
    }>;
    archiveFileUrl: (fileId: string, path: string) => string;
    compressDownload: (fileIds: string[], folderIds: string[], archiveName?: string) => Promise<void>;
    searchFiles: (q: string, filters: import("./store").FilesSearchFilters, opts?: {
        limit?: number;
        offset?: number;
    }) => Promise<{
        results: import("./api").SearchHit[];
        total: number;
        semantic: boolean;
    }>;
    searchSimilar: (image: File) => Promise<{
        results: import("./api").SearchHit[];
        total: number;
        semantic: boolean;
    }>;
    listFiles: (folderId?: string | null, starred?: boolean, trashed?: boolean, recent?: boolean, folderPathPrefix?: string, opts?: {
        limit?: number;
        offset?: number;
    }) => Promise<{
        files: import("./api").FileItem[];
    }>;
    listFilesBySize: (limit?: number) => Promise<{
        files: import("./api").FileItem[];
    }>;
    uploadFile: (file: File, folderId: string | null | undefined, onProgress?: (pct: number) => void, overwrite?: boolean) => Promise<{
        file: import("./api").FileItem;
    }>;
    renameFile: (id: string, name: string, overwrite?: boolean, strict?: boolean) => Promise<{
        file: import("./api").FileItem;
    }>;
    moveFile: (id: string, folderId: string | null, overwrite?: boolean, strict?: boolean) => Promise<{
        file: import("./api").FileItem;
    }>;
    trashFile: (id: string) => Promise<void>;
    restoreFile: (id: string) => Promise<void>;
    deleteFile: (id: string) => Promise<void>;
    purgeTrash: () => Promise<{
        folders_deleted: number;
        files_deleted: number;
    }>;
    setOpenWith: (fileId: string, moduleId: string | null) => Promise<{
        file: import("./api").FileItem;
    }>;
    updateUserMetadata: (fileId: string, data: {
        title?: string;
        description?: string;
        author?: string;
        keywords?: string[];
    }) => Promise<{
        file: import("./api").FileItem;
    }>;
    starFile: (id: string) => Promise<{
        file: import("./api").FileItem;
    }>;
    copyFile: (id: string, folderId: string | null) => Promise<{
        file: import("./api").FileItem;
    }>;
    listFolders: (parentId?: string | null, trashed?: boolean) => Promise<{
        folders: import("./api").Folder[];
    }>;
    trashFolder: (id: string) => Promise<{
        folder: import("./api").Folder;
    }>;
    restoreFolder: (id: string) => Promise<{
        folder: import("./api").Folder;
    }>;
    getFolder: (id: string) => Promise<{
        folder: import("./api").Folder;
        ancestors: import("./api").FolderAncestor[];
    }>;
    createFolder: (name: string, parentId?: string | null) => Promise<{
        folder: import("./api").Folder;
    }>;
    renameFolder: (id: string, name: string, overwrite?: boolean, strict?: boolean) => Promise<{
        folder: import("./api").Folder;
    }>;
    moveFolder: (id: string, parentId: string | null, overwrite?: boolean, strict?: boolean) => Promise<{
        folder: import("./api").Folder;
    }>;
    deleteFolder: (id: string) => Promise<void>;
    starFolder: (id: string) => Promise<{
        folder: import("./api").Folder;
    }>;
    setFolderColor: (id: string, color: string | null) => Promise<{
        folder: import("./api").Folder;
    }>;
    listFoldersBySize: (limit?: number) => Promise<{
        folders: import("./api").FolderSize[];
    }>;
};
