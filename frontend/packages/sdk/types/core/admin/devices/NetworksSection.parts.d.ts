import type { NetworksSection } from './NetworksSection';
export declare function Part1({ origins, set, t }: {
    origins: NonNullable<NetworksSection['origins']>;
    set: NetworksSection['set'];
    t: NonNullable<NetworksSection['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ rows, columns, isLoading, isError, t, refetch, anyFilter, setFilters, setDraft, toolbar, toast }: {
    rows: NonNullable<NetworksSection['rows']>;
    columns: NonNullable<NetworksSection['columns']>;
    isLoading: NonNullable<NetworksSection['isLoading']>;
    isError: NonNullable<NetworksSection['isError']>;
    t: NonNullable<NetworksSection['tr']>;
    refetch: NonNullable<NetworksSection['refetch']>;
    anyFilter: NonNullable<NetworksSection['anyFilter']>;
    setFilters: NonNullable<NetworksSection['setFilters']>;
    setDraft: NonNullable<NetworksSection['setDraft']>;
    toolbar: NonNullable<NetworksSection['toolbar']>;
    toast: NonNullable<NetworksSection['toast']>;
}): import("react").JSX.Element;
