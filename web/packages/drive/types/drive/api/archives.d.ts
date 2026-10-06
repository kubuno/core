import type { ArchiveEntry, FileItem } from './types';
/** Zip archives: create, browse, extract and download. */
export declare const archiveApi: {
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
};
