import type { FileItem } from './api';
interface FilesVideoPlayerState {
    file: FileItem | null;
    restorePosition: number;
    open: (file: FileItem) => void;
    close: () => void;
    _clearRestorePosition: () => void;
}
export declare const useFilesVideoPlayerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<FilesVideoPlayerState>>;
export {};
