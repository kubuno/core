import { type SearchHit } from './api';
export interface FilesSearchFilters {
    type: 'all' | 'folder' | 'document' | 'spreadsheet' | 'presentation' | 'pdf' | 'image' | 'video' | 'audio' | 'archive';
    owner: 'anyone' | 'me' | 'notme';
    containsWords: string;
    itemName: string;
    location: 'everywhere' | 'mydrive';
    inTrash: boolean;
    isStarred: boolean;
    modifiedDate: 'anytime' | 'today' | '7days' | '30days' | 'thisyear' | 'lastyear';
    sharedWith: string;
}
export interface UploadEntry {
    id: string;
    name: string;
    progress: number;
    status: 'uploading' | 'done' | 'error';
    error?: string;
}
interface FilesState {
    searchQuery: string;
    searchFilters: FilesSearchFilters;
    searchApplied: boolean;
    setSearchQuery: (q: string) => void;
    setSearchFilters: (partial: Partial<FilesSearchFilters>) => void;
    applySearch: () => void;
    clearSearch: () => void;
    imageSearch: {
        name: string;
        loading: boolean;
        results: SearchHit[];
        total: number;
    } | null;
    runImageSearch: (file: File) => Promise<void>;
    clearImageSearch: () => void;
    currentFolderId: string | null;
    setCurrentFolderId: (id: string | null) => void;
    newFolderOpen: boolean;
    openNewFolder: () => void;
    closeNewFolder: () => void;
    importUrlOpen: boolean;
    openImportUrl: () => void;
    closeImportUrl: () => void;
    remotesPanelOpen: boolean;
    openRemotesPanel: () => void;
    closeRemotesPanel: () => void;
    _fileInputClick: (() => void) | null;
    _folderInputClick: (() => void) | null;
    registerFileInput: (fn: () => void) => void;
    registerFolderInput: (fn: () => void) => void;
    triggerUpload: () => void;
    triggerFolderUpload: () => void;
    uploadTrigger: number;
    folderUploadTrigger: number;
    refreshKey: number;
    refresh: () => void;
    uploads: UploadEntry[];
    addUpload: (entry: UploadEntry) => void;
    updateUpload: (id: string, patch: Partial<UploadEntry>) => void;
    clearDoneUploads: () => void;
    clipboard: {
        action: 'cut' | 'copy';
        type: 'file' | 'folder';
        id: string;
        name: string;
    } | null;
    setClipboard: (item: FilesState['clipboard']) => void;
    clearClipboard: () => void;
}
export declare const useFilesStore: import("zustand").UseBoundStore<import("zustand").StoreApi<FilesState>>;
export {};
