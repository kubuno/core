import type { BatchRenameItem } from './BatchRenameModal';
interface BatchRenameState {
    open: boolean;
    items: BatchRenameItem[];
    start: (items: BatchRenameItem[]) => void;
    close: () => void;
}
export declare const useBatchRenameStore: import("zustand").UseBoundStore<import("zustand").StoreApi<BatchRenameState>>;
export {};
