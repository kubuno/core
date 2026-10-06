import type { CalendarDetail } from './CalendarDetail';
export declare function Part1({ setEditing, t }: {
    setEditing: NonNullable<CalendarDetail['setEditing']>;
    t: NonNullable<CalendarDetail['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ t, data, columns, isLoading, rowActions, isError, refetch }: {
    t: NonNullable<CalendarDetail['tr']>;
    data: CalendarDetail['data'];
    columns: NonNullable<CalendarDetail['columns']>;
    isLoading: NonNullable<CalendarDetail['isLoading']>;
    rowActions: NonNullable<CalendarDetail['rowActions']>;
    isError: NonNullable<CalendarDetail['isError']>;
    refetch: NonNullable<CalendarDetail['refetch']>;
}): import("react").JSX.Element;
