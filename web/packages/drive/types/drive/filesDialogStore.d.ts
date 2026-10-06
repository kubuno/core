import type { FileItem } from './api';
/** Référence vers un emplacement distant (montage) — pour écrire hors du drive local. */
export interface RemoteRef {
    mountId: string;
    path: string;
}
export interface FolderSelection {
    id: string | null;
    name: string;
    remote?: RemoteRef;
}
export interface OpenDialogOptions {
    title?: string;
    acceptExtensions?: string[];
    acceptMimes?: string[];
    multiple?: boolean;
}
export interface FolderPickerOptions {
    title?: string;
}
export interface SaveDialogOptions {
    title?: string;
    defaultName?: string;
    defaultFolderId?: string | null;
}
export interface SaveDialogResult {
    folderId: string | null;
    name: string;
}
interface FilesDialogState {
    openOpts: OpenDialogOptions | null;
    openResolve: ((file: FileItem | null) => void) | null;
    folderPickerOpts: FolderPickerOptions | null;
    folderPickerResolve: ((folder: FolderSelection | null) => void) | null;
    saveOpts: SaveDialogOptions | null;
    saveResolve: ((result: SaveDialogResult | null) => void) | null;
    openFile: (opts?: OpenDialogOptions) => Promise<FileItem | null>;
    pickFolder: (opts?: FolderPickerOptions) => Promise<FolderSelection | null>;
    saveFile: (opts?: SaveDialogOptions) => Promise<SaveDialogResult | null>;
    _resolveOpen: (file: FileItem | null) => void;
    _resolveFolderPicker: (folder: FolderSelection | null) => void;
    _resolveSave: (result: SaveDialogResult | null) => void;
}
export declare const useFilesDialogStore: import("zustand").UseBoundStore<import("zustand").StoreApi<FilesDialogState>>;
export declare function fileMatchesOptions(name: string, mimeType: string, opts: OpenDialogOptions): boolean;
export {};
