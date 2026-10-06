import type { LabelsOf } from './useDriveLabels';
/** Default: no labels — so an explorer that never provides one renders nothing. */
export declare const DriveLabelsCtx: import("react").Context<LabelsOf>;
export declare function LabelDots({ kind, id, size, className }: {
    kind: 'file' | 'folder';
    id: string;
    size?: number;
    className?: string;
}): import("react").JSX.Element | null;
