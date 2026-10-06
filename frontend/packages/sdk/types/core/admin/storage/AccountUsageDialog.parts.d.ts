import type { AccountUsageDialog } from './AccountUsageDialog';
export declare function Part1({ t, name, onClose, onEditQuota, isLoading, isError, refetch, data, account, reading, modules, rules }: {
    t: NonNullable<AccountUsageDialog['tr']>;
    name: NonNullable<AccountUsageDialog['name']>;
    onClose: NonNullable<AccountUsageDialog['props']['onClose']>;
    onEditQuota: NonNullable<AccountUsageDialog['props']['onEditQuota']>;
    isLoading: NonNullable<AccountUsageDialog['isLoading']>;
    isError: NonNullable<AccountUsageDialog['isError']>;
    refetch: NonNullable<AccountUsageDialog['refetch']>;
    data: NonNullable<AccountUsageDialog['data']>;
    account: NonNullable<AccountUsageDialog['props']['account']>;
    reading: NonNullable<AccountUsageDialog['reading']>;
    modules: NonNullable<AccountUsageDialog['modules']>;
    rules: NonNullable<AccountUsageDialog['rules']>;
}): import("react").JSX.Element;
