import type { ResourcesTab } from './ResourcesTab';
export declare function Part1({ data, columns, isLoading, isError, t, refetch, rowActions, canManage, setEditing }: {
    data: ResourcesTab['data'];
    columns: NonNullable<ResourcesTab['columns']>;
    isLoading: NonNullable<ResourcesTab['isLoading']>;
    isError: NonNullable<ResourcesTab['isError']>;
    t: NonNullable<ResourcesTab['tr']>;
    refetch: NonNullable<ResourcesTab['refetch']>;
    rowActions: NonNullable<ResourcesTab['rowActions']>;
    canManage: NonNullable<ResourcesTab['props']['canManage']>;
    setEditing: NonNullable<ResourcesTab['setEditing']>;
}): import("react").JSX.Element;
