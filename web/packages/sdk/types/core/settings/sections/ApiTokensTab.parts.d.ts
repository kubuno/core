import type { ApiTokensTab } from './ApiTokensTab';
export declare function Part1({ t, soonest }: {
    t: NonNullable<ApiTokensTab['tr']>;
    soonest: NonNullable<ApiTokensTab['soonest']>;
}): import("react").JSX.Element;
export declare function Part2({ isExpired, graceOver }: {
    isExpired: NonNullable<ApiTokensTab['rows_tokens']>[number]['isExpired'];
    graceOver: NonNullable<ApiTokensTab['rows_tokens']>[number]['graceOver'];
}): import("react").JSX.Element;
