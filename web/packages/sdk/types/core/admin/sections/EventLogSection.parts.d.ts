import type { EventLogSection } from './EventLogSection';
export declare function Part1({ t, type, setType, typeOptions }: {
    t: NonNullable<EventLogSection['tr']>;
    type: NonNullable<EventLogSection['type']>;
    setType: NonNullable<EventLogSection['setType']>;
    typeOptions: NonNullable<EventLogSection['typeOptions']>;
}): import("react").JSX.Element;
export declare function Part2({ t, rows, columns, isLoading, isError, refetch, type, setType }: {
    t: NonNullable<EventLogSection['tr']>;
    rows: NonNullable<EventLogSection['rows']>;
    columns: NonNullable<EventLogSection['columns']>;
    isLoading: NonNullable<EventLogSection['isLoading']>;
    isError: NonNullable<EventLogSection['isError']>;
    refetch: NonNullable<EventLogSection['refetch']>;
    type: NonNullable<EventLogSection['type']>;
    setType: NonNullable<EventLogSection['setType']>;
}): import("react").JSX.Element;
