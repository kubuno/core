import { type ClipboardItem } from '../api/clipboard';
import type { KubunoDataEnvelope } from '../registry/DataTransferRegistry';
interface PaneEntry {
    /** Restrict the list to these envelope types (e.g. a module pasting its own). */
    types?: string[];
    resolve: (picked: KubunoDataEnvelope | null) => void;
}
interface ClipboardStore {
    current: PaneEntry | null;
    /** Bumped after every push, so an open pane refreshes itself. */
    revision: number;
    open: (types?: string[]) => Promise<KubunoDataEnvelope | null>;
    close: (picked: KubunoDataEnvelope | null) => void;
    bump: () => void;
}
export declare const useClipboardStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ClipboardStore>>;
/** Show the history; resolves with the chosen envelope (null = dismissed). */
export declare const openClipboardPane: (types?: string[]) => Promise<KubunoDataEnvelope | null>;
/**
 * Record a clip in the history. Fire-and-forget on purpose: the copy itself has
 * already happened on the system clipboard, so a history failure (offline, older
 * server) must stay invisible to the user.
 */
export declare function pushClipboard(envelope: KubunoDataEnvelope): Promise<ClipboardItem | null>;
export {};
