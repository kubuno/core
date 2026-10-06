import type { FileItem } from '../api';
import type { ThumbSpec } from '../storageSource';
export declare function Thumb({ spec, file, className }: {
    spec: ThumbSpec;
    file: FileItem;
    className?: string;
}): import("react").JSX.Element;
