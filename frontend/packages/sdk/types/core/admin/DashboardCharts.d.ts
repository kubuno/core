export declare const CHART_COLORS: string[];
/** Octets → chaîne lisible (Ko/Mo/Go…). */
export declare function fmtBytes(n: number): string;
export declare function BarChart({ data, color, height, unit, }: {
    data: {
        label: string;
        value: number;
    }[];
    color?: string;
    height?: number;
    unit?: string;
}): import("react").JSX.Element;
export declare function AreaChart({ data, color, height, unit, }: {
    data: {
        label: string;
        value: number;
    }[];
    color?: string;
    height?: number;
    unit?: string;
}): import("react").JSX.Element;
export declare function ProgressRing({ pct, label, value, sub, color, size, }: {
    pct: number;
    label?: string;
    value: string;
    sub?: string;
    color?: string;
    size?: number;
}): import("react").JSX.Element;
export declare function DonutChart({ data, centerValue, centerLabel, size, }: {
    data: {
        label: string;
        value: number;
        color: string;
    }[];
    centerValue?: string;
    centerLabel?: string;
    size?: number;
}): import("react").JSX.Element;
export declare function HBarList({ items, color, }: {
    items: {
        label: string;
        value: number;
        max: number;
        sub?: string;
    }[];
    color?: string;
}): import("react").JSX.Element;
export declare function Sparkline({ data, color, width, height }: {
    data: number[];
    color?: string;
    width?: number;
    height?: number;
}): import("react").JSX.Element | null;
