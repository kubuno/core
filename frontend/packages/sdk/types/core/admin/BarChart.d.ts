export declare function BarChart({ data, color, height, unit, xLabels, }: {
    data: {
        label: string;
        value: number;
    }[];
    color?: string;
    height?: number;
    unit?: string;
    /** Writes the category under each bar, thinning them out as far as it must to
     *  keep them from touching. Off by default: where the categories are a series
     *  of days whose exact date adds nothing, the hover tooltip already names the
     *  bar and a row of dates is noise. Turn it on when the reader has to be able
     *  to point at a bar and say *which* one it is — an hour of the day, above
     *  all, is unreadable without it. */
    xLabels?: boolean;
}): import("react").JSX.Element;
