import type { CSSProperties } from 'react';
export type DeletionKind = 'trash' | 'permanent';
export interface PendingItem {
    id: string;
    type: 'file' | 'folder';
}
export interface PendingBatch {
    id: string;
    kind: DeletionKind;
    count: number;
    label: string;
    undoLabel: string;
    duration: number;
}
interface PendingDeletionState {
    batches: PendingBatch[];
    /** id d'élément → type de suppression en cours (pour le style des box). */
    pending: Record<string, DeletionKind>;
    schedule: (opts: {
        kind: DeletionKind;
        items: PendingItem[];
        label: string;
        undoLabel: string;
        commit: (items: PendingItem[]) => void | Promise<unknown>;
        duration?: number;
    }) => void;
    cancel: (batchId: string) => void;
    commitNow: (batchId: string) => void;
}
export declare const usePendingDeletionStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PendingDeletionState>>;
/** Type de suppression en cours pour un élément (undefined si aucun). */
export declare function usePendingKind(id: string): DeletionKind | undefined;
/** Classe appliquée à une box en cours de suppression (non interactive). */
export declare function pendingBoxClass(kind: DeletionKind | undefined): string;
/** Style inline (fond + bordure colorés) d'une box en cours de suppression. */
export declare function pendingBoxStyle(kind: DeletionKind | undefined): CSSProperties | undefined;
export {};
