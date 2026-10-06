import { type Segment } from "./charts";
import { type CategoryReading } from "./categories";
import { ViewBase } from './CategoryComposition.kbview';
import * as __parts from './CategoryComposition.parts';
export type CategoryCompositionProps = {
    reading: CategoryReading;
    /** The server's own held total — the bar's denominator, not a re-derived sum. */
    heldBytes: number;
    ariaLabel: string;
    delegatedBytes: number;
    delegatedObjects: number;
};
export declare class CategoryComposition extends ViewBase {
    tr: CategoryCompositionStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get segments(): Segment[];
    get notBilled(): number;
    get show_segments(): boolean;
    get show_not_segments(): boolean;
    /** `<CompositionBar>`, rendered by a ReactHost. */
    get CompositionBar(): import("react").FunctionComponent<Readonly<import("./CompositionBar").CompositionBarProps>>;
    get composition_bar_props(): {
        segments: Segment[];
        total: number;
        ariaLabel: string;
    };
    get sto_cat_split_billed(): string;
    get sto_cat_split_not_billed(): string;
    /** `<CategoryRow>`, rendered by a ReactHost. */
    get CategoryRow(): typeof __parts.CategoryRow;
    /** The rows of the Repeater over `reading.slices`. */
    get rows_slices(): {
        s: import("./categories").CategorySlice;
        category_row_props: {
            label: string;
            color: string;
            billable: boolean;
            row: import("./api").CategoryUsage;
            showSwatch: boolean;
        } | undefined;
        key: string;
    }[];
    get show_reading_trash(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        reading_trash: import("./api").CategoryUsage;
    };
    /** A part of the screen still written in React (<Callout> icon: a value the property converts (null-when-false)). */
    get Part1(): typeof __parts.Part1;
    /** `<DelegatedNote>`, rendered by a ReactHost. */
    get DelegatedNote(): import("react").FunctionComponent<Readonly<import("./DelegatedNote").DelegatedNoteProps>>;
    get delegated_note_props(): {
        bytes: number;
        objects: number;
        className: string;
    };
}
/** What `useStores()` gives (the types of the fields it fills). */
export type CategoryCompositionStores = ReturnType<CategoryComposition['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<CategoryCompositionProps>>;
export default _default;
