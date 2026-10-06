import type { Folder, FileItem } from './api';
export type DetailsTarget = {
    type: 'folder';
    item: Folder;
} | {
    type: 'file';
    item: FileItem;
} | null;
interface DetailsTargetState {
    target: DetailsTarget;
    /** Where the explorer stands, shown when the selection is empty. */
    folderName: string;
    setDetails: (target: DetailsTarget, folderName: string) => void;
}
export declare const useDetailsTargetStore: import("zustand").UseBoundStore<import("zustand").StoreApi<DetailsTargetState>>;
export {};
