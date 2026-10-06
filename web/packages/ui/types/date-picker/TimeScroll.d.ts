/** Vertical scroller used for hours and minutes; auto-centers the selection. */
export declare function TimeScroll({ values, selected, onSelect, label, }: {
    values: number[];
    selected: number;
    onSelect: (v: number) => void;
    label: string;
}): import("react").JSX.Element;
