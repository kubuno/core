import type { TableItem } from "./types";
import { ViewBase } from './TableFragment.kbview';
import * as __parts from './TableFragment.parts';
export type TableFragmentProps = {
    item: TableItem;
    /** Which rows this fragment shows, and whether it is the first/last one. */
    slice?: {
        from: number;
        to: number;
        continued: boolean;
        last: boolean;
    };
    /**
     * Column widths, in pixels, taken once from the whole table.
     *
     * Without them a fragment lays its columns out from the rows it happens to
     * carry: the sheet whose addresses are short gets a narrow address column,
     * its neighbours' rows wrap where the measured ones did not, and the cut
     * lands somewhere other than where it was computed. Pinning the columns
     * makes every fragment the same table — which is also what a reader expects
     * of a table continued overleaf.
     */
    widths?: number[];
};
export declare class TableFragment extends ViewBase {
    tr: TableFragmentStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get from(): number;
    get to(): number;
    get last(): boolean;
    get h2_text(): string;
    get part1_props(): {
        item: TableItem;
        widths: number[] | undefined;
        from: number;
        to: number;
        last: boolean;
        item_foot: import("react").ReactNode;
    };
    /** A part of the screen still written in React (<table> has no .kbview element yet). */
    get Part1(): typeof __parts.Part1;
    get show_last_item_note(): boolean;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_item_note(): {
        children: string | number | bigint | true | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | import("react").ReactPortal | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | null | undefined>;
    };
}
/** What `useStores()` gives (the types of the fields it fills). */
export type TableFragmentStores = ReturnType<TableFragment['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<TableFragmentProps>>;
export default _default;
