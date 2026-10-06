import { type AlertFilters } from "./types";
import type { AlertsSection } from './AlertsSection';
declare function FilterControls({ filters, set, facets, stacked }: {
    filters: AlertFilters;
    set: <K extends keyof AlertFilters>(k: K, v: AlertFilters[K]) => void;
    facets: {
        kinds: string[];
        all_kinds: string[];
        assignees: {
            id: string;
            label: string;
        }[];
    } | undefined;
    stacked: boolean;
}): import("react").JSX.Element;
export { FilterControls };
export declare function Part1({ rows, columns, isLoading, isError, t, refetch, anyFilter, setFilters, setDraft, toolbar, canManage, selected, setSelected, bulkActions, rowActions, navigate, summary, summary_last_scan_at, i18n, scan, toast }: {
    rows: NonNullable<AlertsSection['rows']>;
    columns: NonNullable<AlertsSection['columns']>;
    isLoading: NonNullable<AlertsSection['isLoading']>;
    isError: NonNullable<AlertsSection['isError']>;
    t: NonNullable<AlertsSection['tr']>;
    refetch: NonNullable<AlertsSection['refetch']>;
    anyFilter: NonNullable<AlertsSection['anyFilter']>;
    setFilters: NonNullable<AlertsSection['setFilters']>;
    setDraft: NonNullable<AlertsSection['setDraft']>;
    toolbar: NonNullable<AlertsSection['toolbar']>;
    canManage: NonNullable<AlertsSection['canManage']>;
    selected: NonNullable<AlertsSection['selected']>;
    setSelected: NonNullable<AlertsSection['setSelected']>;
    bulkActions: NonNullable<AlertsSection['bulkActions']>;
    rowActions: NonNullable<AlertsSection['rowActions']>;
    navigate: NonNullable<AlertsSection['props']['navigate']>;
    summary: AlertsSection['summary'];
    summary_last_scan_at: string;
    i18n: NonNullable<AlertsSection['i18n']>;
    scan: NonNullable<AlertsSection['scan']>;
    toast: NonNullable<AlertsSection['toast']>;
}): import("react").JSX.Element;
export declare function Part2({ sheet, setSheet, t, filters, set, facets }: {
    sheet: NonNullable<AlertsSection['sheet']>;
    setSheet: NonNullable<AlertsSection['setSheet']>;
    t: NonNullable<AlertsSection['tr']>;
    filters: NonNullable<AlertsSection['filters']>;
    set: AlertsSection['set'];
    facets: AlertsSection['facets'];
}): import("react").JSX.Element;
