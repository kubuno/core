import { type ModuleLiveState } from "./adminModules";
import type { ModulesPanel } from './ModulesPanel';
declare function ServiceStatus({ state }: {
    state: ModuleLiveState;
}): import("react").JSX.Element;
export { ServiceStatus };
export declare function Part1({ rows, columns, isLoading, query, setQuery, rowActions, open, t }: {
    rows: NonNullable<ModulesPanel['rows']>;
    columns: NonNullable<ModulesPanel['columns']>;
    isLoading: NonNullable<ModulesPanel['isLoading']>;
    query: NonNullable<ModulesPanel['query']>;
    setQuery: NonNullable<ModulesPanel['setQuery']>;
    rowActions: NonNullable<ModulesPanel['rowActions']>;
    open: ModulesPanel['open'];
    t: NonNullable<ModulesPanel['tr']>;
}): import("react").JSX.Element;
