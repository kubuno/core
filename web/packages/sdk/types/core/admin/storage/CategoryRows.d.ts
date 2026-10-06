import { type CategoryRules } from "./categories";
import type { CategoryUsage } from "./api";
import { ViewBase } from './CategoryRows.kbview';
import * as __parts from './CategoryRows.parts';
export type CategoryRowsProps = {
    rows: CategoryUsage[];
    rules: CategoryRules;
};
export declare class CategoryRows extends ViewBase {
    tr: CategoryRowsStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get held(): CategoryUsage[];
    get show_case_1(): boolean;
    get show_main(): boolean;
    /** `<CategoryRow>`, rendered by a ReactHost. */
    get CategoryRow(): typeof __parts.CategoryRow;
    /** The rows of the Repeater over `held`. */
    get rows_held(): {
        row: CategoryUsage;
        category_row_props: {
            label: string;
            color: null;
            billable: boolean;
            row: CategoryUsage;
            showSwatch: boolean;
        } | undefined;
        key: string;
    }[];
}
/** What `useStores()` gives (the types of the fields it fills). */
export type CategoryRowsStores = ReturnType<CategoryRows['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<CategoryRowsProps>>;
export default _default;
