import type { FileItem } from '../api';
import type { ThumbSpec } from '../storageSource';
export declare function MediaViewer({ files, start, contentOf, onClose }: {
    files: FileItem[];
    start: number;
    contentOf: (f: FileItem) => ThumbSpec;
    onClose: () => void;
}): import("react").JSX.Element;
