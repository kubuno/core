import type { DomainsSection } from './DomainsSection';
declare function Figure({ value, label }: {
    value: number | string;
    label: string;
}): import("react").JSX.Element;
export { Figure };
export declare function Part1({ setAdding, t }: {
    setAdding: NonNullable<DomainsSection['setAdding']>;
    t: NonNullable<DomainsSection['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ t, domains, columns, isLoading, rowActions, open, isError, refetch, canManage, setAdding }: {
    t: NonNullable<DomainsSection['tr']>;
    domains: NonNullable<DomainsSection['domains']>;
    columns: NonNullable<DomainsSection['columns']>;
    isLoading: NonNullable<DomainsSection['isLoading']>;
    rowActions: NonNullable<DomainsSection['rowActions']>;
    open: DomainsSection['open'];
    isError: NonNullable<DomainsSection['isError']>;
    refetch: NonNullable<DomainsSection['refetch']>;
    canManage: NonNullable<DomainsSection['canManage']>;
    setAdding: NonNullable<DomainsSection['setAdding']>;
}): import("react").JSX.Element;
