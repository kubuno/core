import type { DetectorsSection } from './DetectorsSection';
export declare function Part1({ rows, columns, isLoading, isError, t, refetch, rowActions, setEditing, canManage }: {
    rows: NonNullable<DetectorsSection['rows']>;
    columns: NonNullable<DetectorsSection['columns']>;
    isLoading: NonNullable<DetectorsSection['isLoading']>;
    isError: NonNullable<DetectorsSection['isError']>;
    t: NonNullable<DetectorsSection['tr']>;
    refetch: NonNullable<DetectorsSection['refetch']>;
    rowActions: NonNullable<DetectorsSection['rowActions']>;
    setEditing: NonNullable<DetectorsSection['setEditing']>;
    canManage: NonNullable<DetectorsSection['canManage']>;
}): import("react").JSX.Element;
