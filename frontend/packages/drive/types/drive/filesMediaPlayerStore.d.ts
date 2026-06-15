import type { FileItem } from './api';
interface FilesMediaPlayerState {
    file: FileItem | null;
    isMinimized: boolean;
    isPlaying: boolean;
    position: number;
    duration: number;
    restorePosition: number;
    open: (file: FileItem) => void;
    minimize: () => void;
    restore: () => void;
    close: () => void;
    _clearRestorePosition: () => void;
    _setPlaying: (v: boolean) => void;
    _setPosition: (v: number) => void;
    _setDuration: (v: number) => void;
}
export declare const useFilesMediaPlayerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<FilesMediaPlayerState>>;
export {};
