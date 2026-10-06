import type { BuildingsTab } from './BuildingsTab';
export declare function Part1({ rows, columns, isLoading, isError, t, refetch, rowActions, canManage, setEditing }: {
    rows: NonNullable<BuildingsTab['rows']>;
    columns: NonNullable<BuildingsTab['columns']>;
    isLoading: NonNullable<BuildingsTab['isLoading']>;
    isError: NonNullable<BuildingsTab['isError']>;
    t: NonNullable<BuildingsTab['tr']>;
    refetch: NonNullable<BuildingsTab['refetch']>;
    rowActions: NonNullable<BuildingsTab['rowActions']>;
    canManage: NonNullable<BuildingsTab['props']['canManage']>;
    setEditing: NonNullable<BuildingsTab['setEditing']>;
}): import("react").JSX.Element;
