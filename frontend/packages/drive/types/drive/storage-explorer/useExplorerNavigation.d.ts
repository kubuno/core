import type { Folder } from '../api';
import type { StorageSource } from '../storageSource';
export declare function useExplorerNavigation({ src, pathParam, onNavigated }: {
    src: StorageSource;
    /** URL parameter mirroring the position (ex. "path" remote, "folder" local). */
    pathParam?: string;
    /** Called on every position change (used to drop the current selection). */
    onNavigated: () => void;
}): {
    currentFolderId: string | null;
    breadcrumbs: {
        id: string;
        name: string;
    }[];
    navigateTo: (folder: Folder) => void;
    navigateUp: (idx: number) => void;
};
