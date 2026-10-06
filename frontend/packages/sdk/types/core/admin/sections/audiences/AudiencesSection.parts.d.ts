import type { AudiencesSection } from './AudiencesSection';
export declare function Part1({ rows, columns, isLoading, isError, t, refetch, q, setQ, toolbar, rowActions, go }: {
    rows: NonNullable<AudiencesSection['rows']>;
    columns: NonNullable<AudiencesSection['columns']>;
    isLoading: NonNullable<AudiencesSection['isLoading']>;
    isError: NonNullable<AudiencesSection['isError']>;
    t: NonNullable<AudiencesSection['tr']>;
    refetch: NonNullable<AudiencesSection['refetch']>;
    q: NonNullable<AudiencesSection['q']>;
    setQ: NonNullable<AudiencesSection['setQ']>;
    toolbar: NonNullable<AudiencesSection['toolbar']>;
    rowActions: NonNullable<AudiencesSection['rowActions']>;
    go: AudiencesSection['go'];
}): import("react").JSX.Element;
