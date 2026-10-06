import type { FileItem } from './api';
interface FilesPaintState {
    open: boolean;
    file: FileItem | null;
    openEditor: (file: FileItem) => void;
    closeEditor: () => void;
}
export declare const useFilesPaintStore: import("zustand").UseBoundStore<import("zustand").StoreApi<FilesPaintState>>;
export {};
