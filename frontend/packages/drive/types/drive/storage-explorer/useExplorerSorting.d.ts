import type { Folder, FileItem } from '../api';
import type { SortField } from './types';
export declare function useExplorerSorting({ folders, files, sortField, sortDir, typeFilter, showHidden }: {
    folders: Folder[];
    files: FileItem[];
    sortField: SortField;
    sortDir: 'asc' | 'desc';
    typeFilter: string | null;
    showHidden: boolean;
}): {
    filteredFiles: FileItem[];
    sortedFolders: Folder[];
    orderedIds: string[];
};
