import type { CategoryUsage } from "./api";
declare function CategoryRow({ label, color, billable, row, showSwatch, }: {
    label: string;
    color: string | null;
    billable: boolean;
    row: CategoryUsage;
    showSwatch: boolean;
}): import("react").JSX.Element;
export { CategoryRow };
