import type { RulesSection } from './RulesSection';
export declare function Part1({ rows, columns, isLoading, isError, t, refetch, anyFilter, setQ, setModeFilter, setModuleFilter, toolbar, rowActions, navigate, canWrite }: {
    rows: NonNullable<RulesSection['rows']>;
    columns: NonNullable<RulesSection['columns']>;
    isLoading: NonNullable<RulesSection['isLoading']>;
    isError: NonNullable<RulesSection['isError']>;
    t: NonNullable<RulesSection['tr']>;
    refetch: NonNullable<RulesSection['refetch']>;
    anyFilter: NonNullable<RulesSection['anyFilter']>;
    setQ: NonNullable<RulesSection['setQ']>;
    setModeFilter: NonNullable<RulesSection['setModeFilter']>;
    setModuleFilter: NonNullable<RulesSection['setModuleFilter']>;
    toolbar: NonNullable<RulesSection['toolbar']>;
    rowActions: NonNullable<RulesSection['rowActions']>;
    navigate: NonNullable<RulesSection['props']['navigate']>;
    canWrite: NonNullable<RulesSection['canWrite']>;
}): import("react").JSX.Element;
