import type { OverviewBar } from './OverviewBar';
declare function Figure({ value, label }: {
    value: number | string;
    label: string;
}): import("react").JSX.Element;
export { Figure };
export declare function Part1({ reload, setError, t }: {
    reload: NonNullable<OverviewBar['reload']>;
    setError: NonNullable<OverviewBar['setError']>;
    t: NonNullable<OverviewBar['tr']>;
}): import("react").JSX.Element;
