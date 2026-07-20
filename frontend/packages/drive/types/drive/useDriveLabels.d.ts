import { type CoreLabel } from '../core/api/labels';
/** Labels carried by one entry, newest-first; empty (stable ref) when none. */
export type LabelsOf = (kind: 'file' | 'folder', id: string) => CoreLabel[];
export declare function useDriveLabels(enabled: boolean): LabelsOf;
