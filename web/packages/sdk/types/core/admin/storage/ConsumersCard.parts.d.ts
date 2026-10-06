import type { ConsumersCard } from './ConsumersCard';
export declare function Part1({ rows, columns, isLoading, isError, t, refetch, rowActions, setInspecting, filter, setFilter, sort, setSort }: {
    rows: NonNullable<ConsumersCard['rows']>;
    columns: NonNullable<ConsumersCard['columns']>;
    isLoading: NonNullable<ConsumersCard['isLoading']>;
    isError: NonNullable<ConsumersCard['isError']>;
    t: NonNullable<ConsumersCard['tr']>;
    refetch: NonNullable<ConsumersCard['refetch']>;
    rowActions: NonNullable<ConsumersCard['rowActions']>;
    setInspecting: NonNullable<ConsumersCard['setInspecting']>;
    filter: NonNullable<ConsumersCard['filter']>;
    setFilter: NonNullable<ConsumersCard['setFilter']>;
    sort: NonNullable<ConsumersCard['sort']>;
    setSort: NonNullable<ConsumersCard['setSort']>;
}): import("react").JSX.Element;
