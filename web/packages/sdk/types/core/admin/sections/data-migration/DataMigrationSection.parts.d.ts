import type { DataMigrationSection } from './DataMigrationSection';
export declare function Part1({ noService, setComposing, t }: {
    noService: NonNullable<DataMigrationSection['noService']>;
    setComposing: NonNullable<DataMigrationSection['setComposing']>;
    t: NonNullable<DataMigrationSection['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ t, campaigns, columns, isLoading, rowActions, open, isError, refetch, canManage, noService, setComposing }: {
    t: NonNullable<DataMigrationSection['tr']>;
    campaigns: NonNullable<DataMigrationSection['campaigns']>;
    columns: NonNullable<DataMigrationSection['columns']>;
    isLoading: NonNullable<DataMigrationSection['isLoading']>;
    rowActions: NonNullable<DataMigrationSection['rowActions']>;
    open: DataMigrationSection['open'];
    isError: NonNullable<DataMigrationSection['isError']>;
    refetch: NonNullable<DataMigrationSection['refetch']>;
    canManage: NonNullable<DataMigrationSection['canManage']>;
    noService: NonNullable<DataMigrationSection['noService']>;
    setComposing: NonNullable<DataMigrationSection['setComposing']>;
}): import("react").JSX.Element;
