import type { MenuItem } from '@ui';
import type { Folder, FileItem } from '../api';
import { type DetailsColsView, type DetailsSettings } from './detailsModel';
import type { TFunc } from './types';
export declare function useDetailsColumns({ details, persistDetails, sortedFolders, filteredFiles, t, lng }: {
    details: DetailsSettings;
    persistDetails: (updater: (s: DetailsSettings) => DetailsSettings) => void;
    sortedFolders: Folder[];
    filteredFiles: FileItem[];
    t: TFunc;
    lng: string;
}): {
    detailsView: DetailsColsView;
    headerMenuItems: MenuItem[];
};
