import { type ViewMode } from '../fileView';
import { type DetailsSettings } from './detailsModel';
export declare function useViewPrefs(dirKey: string, isMobile: boolean): {
    viewMode: ViewMode;
    changeViewMode: (m: ViewMode) => void;
    details: DetailsSettings;
    persistDetails: (updater: (s: DetailsSettings) => DetailsSettings) => void;
};
