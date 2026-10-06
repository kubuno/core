import type { StorageSection } from './StorageSection';
export declare function Part1({ t, data }: {
    t: NonNullable<StorageSection['tr']>;
    data: NonNullable<StorageSection['data']>;
}): import("react").JSX.Element;
export declare function Part2({ t, data }: {
    t: NonNullable<StorageSection['tr']>;
    data: NonNullable<StorageSection['data']>;
}): import("react").JSX.Element;
export declare function Part3({ t, trendData }: {
    t: NonNullable<StorageSection['tr']>;
    trendData: NonNullable<StorageSection['trendData']>;
}): import("react").JSX.Element;
export declare function Part4({ t, trendData }: {
    t: NonNullable<StorageSection['tr']>;
    trendData: NonNullable<StorageSection['trendData']>;
}): import("react").JSX.Element;
export declare function Part5({ t, projection, projection_daysLeft }: {
    t: NonNullable<StorageSection['tr']>;
    projection: NonNullable<StorageSection['projection']>;
    projection_daysLeft: number;
}): import("react").JSX.Element;
export declare function Part6({ u, data, t }: {
    u: NonNullable<StorageSection['rows_by_unit']>[number]['u'];
    data: NonNullable<StorageSection['data']>;
    t: NonNullable<StorageSection['tr']>;
}): import("react").JSX.Element;
export declare function Part7({ canManageSettings, warnDraft, data, setWarnDraft, t }: {
    canManageSettings: NonNullable<StorageSection['canManageSettings']>;
    warnDraft: StorageSection['warnDraft'];
    data: NonNullable<StorageSection['data']>;
    setWarnDraft: NonNullable<StorageSection['setWarnDraft']>;
    t: NonNullable<StorageSection['tr']>;
}): import("react").JSX.Element;
