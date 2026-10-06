/**
 * Details-view model: which optional columns exist, their defaults, and how a
 * folder/file renders into each cell. Pure data + formatting — no React.
 */
import { type Folder, type FileItem } from '../api';
import type { SortField, TFunc } from './types';
/** Sort fields reachable from the details header (same union as the toolbar). */
export type DetailsSortField = SortField;
export type DetailsColKey = 'labels' | 'date' | 'type' | 'size' | 'created';
export declare const DETAILS_COL_ORDER: DetailsColKey[];
export declare const DETAILS_COL_SORT: Partial<Record<DetailsColKey, DetailsSortField>>;
export type DetailsSettings = {
    widths: Record<DetailsColKey, number>;
    visible: Record<DetailsColKey, boolean>;
};
export declare const DETAILS_DEFAULT: DetailsSettings;
export type DetailsColsView = {
    order: DetailsColKey[];
    widths: Record<DetailsColKey, number>;
};
export declare function mergeDetails(d?: Partial<DetailsSettings>): DetailsSettings;
export declare function detailsColLabel(key: DetailsColKey, t: TFunc): string;
export declare function longDate(iso: string, lng: string): string;
export declare function fileCellText(key: DetailsColKey, file: FileItem, t: TFunc, lng: string): string;
export declare function folderCellText(key: DetailsColKey, folder: Folder, t: TFunc, lng: string): string;
/** Sort direction wording, phrased per field (« De A à Z » only fits a name). */
export declare function sortDirLabels(field: SortField, t: TFunc): {
    asc: string;
    desc: string;
};
