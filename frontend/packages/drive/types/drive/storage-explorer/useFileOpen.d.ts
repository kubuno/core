import type { NavigateFunction } from 'react-router-dom';
import { type FileItem } from '../api';
import type { StorageSource } from '../storageSource';
export declare function useFileOpen({ src, caps, navigate, onOpenFile }: {
    src: StorageSource;
    caps: StorageSource['capabilities'];
    navigate: NavigateFunction;
    onOpenFile?: (file: FileItem) => boolean | void;
}): {
    viewerFile: FileItem | null;
    setViewerFile: import("react").Dispatch<import("react").SetStateAction<FileItem | null>>;
    textFile: FileItem | null;
    setTextFile: import("react").Dispatch<import("react").SetStateAction<FileItem | null>>;
    openFile: (file: FileItem) => Promise<void>;
};
