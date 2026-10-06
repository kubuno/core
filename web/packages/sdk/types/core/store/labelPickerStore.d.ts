import type { KubunoDataEnvelope } from '../registry/DataTransferRegistry';
interface PickerEntry {
    envelope: KubunoDataEnvelope;
    resourceId: string;
    resolve: (changed: boolean) => void;
}
interface LabelPickerStore {
    current: PickerEntry | null;
    open: (envelope: KubunoDataEnvelope) => Promise<boolean>;
    close: (changed: boolean) => void;
}
/**
 * Stable identity of the element an envelope describes: its module id when the
 * payload carries one, otherwise a content hash. Everything that produces the
 * same key is considered the same element by the label system.
 */
export declare function resourceKeyOf(envelope: KubunoDataEnvelope): string;
export declare const useLabelPickerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<LabelPickerStore>>;
/** Imperative entry point (also published as a `core` module service). */
export declare const openLabelPicker: (envelope: KubunoDataEnvelope) => Promise<boolean>;
export {};
