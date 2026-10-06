import type { KubunoDataEnvelope } from '../registry/DataTransferRegistry';
export interface ClipboardItem {
    id: string;
    /** Producing module id ('office', 'maps'…). */
    module: string;
    /** Envelope type ('office.shape', 'maps.place'…). */
    kind: string;
    title: string | null;
    /** Human-readable summary shown in the pane. */
    preview: string | null;
    /** The envelope itself — rendered through the producer's data-card renderer. */
    payload: KubunoDataEnvelope;
    href: string | null;
    /** Pinned entries survive the trim and « Effacer l'historique ». */
    pinned: boolean;
    created_at: string;
    updated_at: string;
}
export declare const clipboardApi: {
    list(limit?: number): Promise<ClipboardItem[]>;
    /**
     * Record a clip. Never throws at the caller: a history that is unavailable
     * (offline, older server) must not break the copy itself, which has already
     * happened on the system clipboard.
     */
    push(envelope: KubunoDataEnvelope, opts?: {
        pinned?: boolean;
    }): Promise<ClipboardItem | null>;
    setPinned(id: string, pinned: boolean): Promise<void>;
    remove(id: string): Promise<void>;
    /** Clears everything except the pinned entries. */
    clear(): Promise<number>;
};
