import type { ImpactPanel } from './ImpactPanel';
declare function Figure({ label, value, hint }: {
    label: string;
    value: number | string;
    hint?: string;
}): import("react").JSX.Element;
export { Figure };
export declare function Part1({ ratio, t }: {
    ratio: NonNullable<ImpactPanel['ratio']>;
    t: NonNullable<ImpactPanel['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ d, peak }: {
    d: NonNullable<ImpactPanel['rows_items2']>[number]['d'];
    peak: NonNullable<ImpactPanel['rows_items2']>[number]['peak'];
}): import("react").JSX.Element;
export declare function Part3({ t, report }: {
    t: NonNullable<ImpactPanel['tr']>;
    report: NonNullable<ImpactPanel['report']>;
}): import("react").JSX.Element;
