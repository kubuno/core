import type { CategoryUsage } from "./api";
import type { CategoryComposition } from './CategoryComposition';
declare function CategoryRow({ label, color, billable, row, showSwatch, }: {
    label: string;
    color: string | null;
    billable: boolean;
    row: CategoryUsage;
    showSwatch: boolean;
}): import("react").JSX.Element;
export { CategoryRow };
export declare function Part1({ t, reading_trash }: {
    t: NonNullable<CategoryComposition['tr']>;
    reading_trash: CategoryUsage;
}): import("react").JSX.Element;
