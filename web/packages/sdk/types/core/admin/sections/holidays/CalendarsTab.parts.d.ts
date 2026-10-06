import type { CalendarsTab } from './CalendarsTab';
export declare function Part1({ search, setSearch, t }: {
    search: NonNullable<CalendarsTab['search']>;
    setSearch: NonNullable<CalendarsTab['setSearch']>;
    t: NonNullable<CalendarsTab['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ setCreating, t }: {
    setCreating: NonNullable<CalendarsTab['setCreating']>;
    t: NonNullable<CalendarsTab['tr']>;
}): import("react").JSX.Element;
export declare function Part3({ t, data, columns, isLoading, rowActions, onOpen, isError, refetch, search, countriesOnly, setSearch, setCountriesOnly }: {
    t: NonNullable<CalendarsTab['tr']>;
    data: CalendarsTab['data'];
    columns: NonNullable<CalendarsTab['columns']>;
    isLoading: NonNullable<CalendarsTab['isLoading']>;
    rowActions: NonNullable<CalendarsTab['rowActions']>;
    onOpen: NonNullable<CalendarsTab['props']['onOpen']>;
    isError: NonNullable<CalendarsTab['isError']>;
    refetch: NonNullable<CalendarsTab['refetch']>;
    search: NonNullable<CalendarsTab['search']>;
    countriesOnly: NonNullable<CalendarsTab['countriesOnly']>;
    setSearch: NonNullable<CalendarsTab['setSearch']>;
    setCountriesOnly: NonNullable<CalendarsTab['setCountriesOnly']>;
}): import("react").JSX.Element;
