import type { FilesSearchFilters } from './store';
export interface FolderAncestor {
    id: string;
    name: string;
}
export interface Folder {
    id: string;
    name: string;
    parent_id: string | null;
    path: string;
    is_starred: boolean;
    is_protected: boolean;
    is_trashed: boolean;
    trashed_at: string | null;
    versioning_enabled: boolean;
    color: string | null;
    icon: string | null;
    owner_id: string;
    created_at: string;
    updated_at: string;
}
export interface FileItem {
    id: string;
    name: string;
    folder_id: string | null;
    size_bytes: number;
    mime_type: string;
    is_starred: boolean;
    is_trashed: boolean;
    has_thumbnail: boolean;
    versioning_enabled: boolean;
    metadata: Record<string, unknown>;
    owner_id: string;
    created_at: string;
    updated_at: string;
}
/** Résultat de recherche : un fichier enrichi d'un extrait et d'un score. */
export interface SearchHit extends FileItem {
    snippet: string | null;
    score: number;
    match_kind: 'text' | 'name' | 'semantic';
    folder_path: string | null;
}
export interface FileVersion {
    id: string;
    file_id: string;
    owner_id: string;
    version_number: number;
    storage_path: string;
    size_bytes: number;
    content_hash: string | null;
    comment: string | null;
    created_at: string;
}
export interface Share {
    id: string;
    owner_id: string;
    file_id: string | null;
    folder_id: string | null;
    token: string | null;
    recipient_id: string | null;
    can_download: boolean;
    can_upload: boolean;
    can_delete: boolean;
    expires_at: string | null;
    download_count: number;
    max_downloads: number | null;
    created_at: string;
    updated_at: string;
    revoked_at: string | null;
}
export interface CreateShareOptions {
    file_id?: string;
    folder_id?: string;
    recipient_id?: string;
    can_download?: boolean;
    can_upload?: boolean;
    can_delete?: boolean;
    expires_at?: string | null;
    max_downloads?: number | null;
}
export interface Recipient {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
}
export interface FolderSize {
    id: string;
    name: string;
    path: string;
    total_size: number;
    file_count: number;
}
export interface ActivityEntry {
    id: number;
    user_id: string;
    user_display: string;
    action: string;
    details: Record<string, unknown>;
    created_at: string;
}
export interface OwnerInfo {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
}
export interface AccessEntry {
    share_id: string;
    recipient_id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
    can_download: boolean;
    can_upload: boolean;
    can_delete: boolean;
    expires_at: string | null;
    created_at: string;
}
export interface InfoExtra {
    owner: OwnerInfo | null;
    access: AccessEntry[];
}
export interface RemoteConnection {
    id: string;
    name: string;
    provider: string;
    mount_name: string;
    status: 'connected' | 'disconnected' | 'error' | 'syncing';
    last_connected_at: string | null;
    last_error: string | null;
    remote_quota_bytes: number | null;
    remote_used_bytes: number | null;
    created_at: string;
}
export interface CreateRemoteDto {
    name: string;
    provider: string;
    config: Record<string, unknown>;
}
/** Une entrée (dossier/fichier) listée en direct dans un montage distant. */
export interface RemoteEntry {
    name: string;
    path: string;
    is_dir: boolean;
    size_bytes: number;
}
export interface TestRemoteResult {
    ok: boolean;
    error?: string;
    quota?: {
        total_bytes: number | null;
        used_bytes: number | null;
        free_bytes: number | null;
    };
}
export interface ArchiveEntry {
    name: string;
    path: string;
    is_dir: boolean;
    size: number;
    compressed_size: number;
}
export declare const filesApi: {
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
    listFiles: (folderId?: string | null, starred?: boolean, trashed?: boolean, recent?: boolean, folderPathPrefix?: string) => Promise<{
        files: FileItem[];
    }>;
    searchFiles: (q: string, filters: FilesSearchFilters, opts?: {
        limit?: number;
        offset?: number;
    }) => Promise<{
        results: SearchHit[];
        total: number;
        semantic: boolean;
    }>;
    searchSimilar: (image: File) => Promise<{
        results: SearchHit[];
        total: number;
        semantic: boolean;
    }>;
    listFilesBySize: (limit?: number) => Promise<{
        files: FileItem[];
    }>;
    listFoldersBySize: (limit?: number) => Promise<{
        folders: FolderSize[];
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
    compressSave: (fileIds: string[], folderIds: string[], archiveName?: string, folderId?: string | null) => Promise<{
        file: FileItem;
    }>;
    decompress: (fileId: string, folderId?: string | null, createSubfolder?: boolean) => Promise<{
        extracted: number;
        folder_id: string | null;
    }>;
    listArchive: (fileId: string, path?: string) => Promise<{
        entries: ArchiveEntry[];
        path: string;
        total: number;
    }>;
    archiveFileUrl: (fileId: string, path: string) => string;
    compressDownload: (fileIds: string[], folderIds: string[], archiveName?: string) => Promise<void>;
    listShares: () => Promise<{
        shares: Share[];
    }>;
    createShare: (opts: CreateShareOptions) => Promise<{
        share: Share;
    }>;
    searchRecipients: (q: string, limit?: number) => Promise<Recipient[]>;
    revokeShare: (id: string) => Promise<void>;
    thumbnailUrl: (id: string) => string;
    downloadUrl: (id: string) => string;
    downloadBlob: (id: string) => Promise<Blob>;
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
    getFileActivity: (id: string) => Promise<{
        activities: ActivityEntry[];
    }>;
    getFolderActivity: (id: string) => Promise<{
        activities: ActivityEntry[];
    }>;
    getFileInfoExtra: (id: string) => Promise<InfoExtra>;
    getFolderInfoExtra: (id: string) => Promise<InfoExtra>;
    revokeAccess: (shareId: string) => Promise<void>;
    listRemotes: () => Promise<RemoteConnection[]>;
    createRemote: (dto: CreateRemoteDto) => Promise<{
        id: string;
        mount_name: string;
    }>;
    deleteRemote: (id: string) => Promise<void>;
    testRemote: (id: string) => Promise<TestRemoteResult>;
    browseRemote: (id: string, path: string) => Promise<RemoteEntry[]>;
    deleteRemoteEntry: (id: string, path: string) => Promise<void>;
    renameRemoteEntry: (id: string, path: string, to: string) => Promise<void>;
    createRemoteDir: (id: string, path: string) => Promise<void>;
    uploadRemoteFile: (id: string, path: string, data: Blob | File) => Promise<void>;
    fetchRemoteFileBlob: (id: string, path: string) => Promise<Blob>;
    downloadRemoteFile: (id: string, path: string, fileName: string) => Promise<void>;
};
export declare function formatSize(bytes: number): string;
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
