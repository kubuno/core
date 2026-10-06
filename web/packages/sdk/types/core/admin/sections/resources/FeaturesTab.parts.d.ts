import type { FeaturesTab } from './FeaturesTab';
export declare function Part1({ data, columns, isLoading, isError, t, refetch, rowActions, canManage, setEditing }: {
    data: FeaturesTab['data'];
    columns: NonNullable<FeaturesTab['columns']>;
    isLoading: NonNullable<FeaturesTab['isLoading']>;
    isError: NonNullable<FeaturesTab['isError']>;
    t: NonNullable<FeaturesTab['tr']>;
    refetch: NonNullable<FeaturesTab['refetch']>;
    rowActions: NonNullable<FeaturesTab['rowActions']>;
    canManage: NonNullable<FeaturesTab['props']['canManage']>;
    setEditing: NonNullable<FeaturesTab['setEditing']>;
}): import("react").JSX.Element;
