import type { AdminSearchPanel } from './AdminSearchPanel';
declare function Heading({ label, onViewAll }: {
    label: string;
    onViewAll?: () => void;
}): import("react").JSX.Element;
export { Heading };
export declare function Part1({ listId, t }: {
    listId: NonNullable<AdminSearchPanel['listId']>;
    t: NonNullable<AdminSearchPanel['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ listId, t, props, activeIndex, optionId, mobile, onPick, setActive }: {
    listId: NonNullable<AdminSearchPanel['listId']>;
    t: NonNullable<AdminSearchPanel['tr']>;
    props: NonNullable<AdminSearchPanel['props']>;
    activeIndex: NonNullable<AdminSearchPanel['activeIndex']>;
    optionId: NonNullable<AdminSearchPanel['optionId']>;
    mobile: NonNullable<AdminSearchPanel['mobile']>;
    onPick: NonNullable<AdminSearchPanel['onPick']>;
    setActive: NonNullable<AdminSearchPanel['setActive']>;
}): import("react").JSX.Element;
export declare function Part3({ listId, t, runs, onNavigate, query, index, activeIndex, optionId, mobile, onPick, setActive }: {
    listId: NonNullable<AdminSearchPanel['listId']>;
    t: NonNullable<AdminSearchPanel['tr']>;
    runs: NonNullable<AdminSearchPanel['runs']>;
    onNavigate: NonNullable<AdminSearchPanel['onNavigate']>;
    query: NonNullable<AdminSearchPanel['query']>;
    index: NonNullable<AdminSearchPanel['index']>;
    activeIndex: NonNullable<AdminSearchPanel['activeIndex']>;
    optionId: NonNullable<AdminSearchPanel['optionId']>;
    mobile: NonNullable<AdminSearchPanel['mobile']>;
    onPick: NonNullable<AdminSearchPanel['onPick']>;
    setActive: NonNullable<AdminSearchPanel['setActive']>;
}): import("react").JSX.Element;
