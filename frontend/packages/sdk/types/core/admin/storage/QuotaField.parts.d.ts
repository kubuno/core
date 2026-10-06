import type { QuotaField } from './QuotaField';
export declare function Part1({ label, amount, autoFocus, onAmount, error }: {
    label: NonNullable<QuotaField['props']['label']>;
    amount: NonNullable<QuotaField['props']['amount']>;
    autoFocus: QuotaField['props']['autoFocus'];
    onAmount: NonNullable<QuotaField['props']['onAmount']>;
    error: QuotaField['props']['error'];
}): import("react").JSX.Element;
export declare function Part2({ u, unit, onUnit }: {
    u: NonNullable<QuotaField['rows_units']>[number]['u'];
    unit: NonNullable<QuotaField['props']['unit']>;
    onUnit: NonNullable<QuotaField['props']['onUnit']>;
}): import("react").JSX.Element;
