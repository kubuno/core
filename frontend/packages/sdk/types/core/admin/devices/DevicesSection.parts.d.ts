import { type DeviceFilters } from "../../devices/types";
import type { DevicesSection } from './DevicesSection';
declare function FilterControls({ filters, set, facets, stacked }: {
    filters: DeviceFilters;
    set: <K extends keyof DeviceFilters>(k: K, v: DeviceFilters[K]) => void;
    facets: {
        platforms: string[];
        countries: string[];
        device_types: string[];
    } | undefined;
    stacked: boolean;
}): import("react").JSX.Element;
export { FilterControls };
export declare function Part1({ rows, columns, isLoading, isError, t, refetch, anyFilter, setFilters, setDraft, toolbar, rowActions, navigate }: {
    rows: NonNullable<DevicesSection['rows']>;
    columns: NonNullable<DevicesSection['columns']>;
    isLoading: NonNullable<DevicesSection['isLoading']>;
    isError: NonNullable<DevicesSection['isError']>;
    t: NonNullable<DevicesSection['tr']>;
    refetch: NonNullable<DevicesSection['refetch']>;
    anyFilter: NonNullable<DevicesSection['anyFilter']>;
    setFilters: NonNullable<DevicesSection['setFilters']>;
    setDraft: NonNullable<DevicesSection['setDraft']>;
    toolbar: NonNullable<DevicesSection['toolbar']>;
    rowActions: NonNullable<DevicesSection['rowActions']>;
    navigate: NonNullable<DevicesSection['props']['navigate']>;
}): import("react").JSX.Element;
export declare function Part2({ sheet, setSheet, t, filters, set, facets }: {
    sheet: NonNullable<DevicesSection['sheet']>;
    setSheet: NonNullable<DevicesSection['setSheet']>;
    t: NonNullable<DevicesSection['tr']>;
    filters: NonNullable<DevicesSection['filters']>;
    set: DevicesSection['set'];
    facets: DevicesSection['facets'];
}): import("react").JSX.Element;
