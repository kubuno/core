import { type AdminResult } from "./adminSearchIndex";
import type { RecentTarget } from "./adminSearchRecents";
import { ResultRow } from "./ResultRow";
import { ViewBase } from './AdminSearchPanel.kbview';
import * as __parts from './AdminSearchPanel.parts';
export interface RowProps {
    result: AdminResult;
    active: boolean;
    optionId: string;
    mobile: boolean;
    onPick: (r: AdminResult) => void;
    /** Keeps the input focused: a row must never steal it away from the field. */
    onHover: () => void;
}
export interface PanelProps {
    listId: string;
    optionId: (index: number) => string;
    /** Flat list in keyboard order — the single source of both orders. */
    results: AdminResult[];
    activeIndex: number;
    setActive: (index: number) => void;
    onPick: (result: AdminResult) => void;
    onNavigate: (url: string) => void;
    query: string;
    recents: RecentTarget[];
    suggestions: AdminResult[];
    nearMisses: AdminResult[];
    loading: boolean;
    mobile: boolean;
}
export declare class AdminSearchPanel extends ViewBase {
    tr: AdminSearchPanelStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get listId(): string;
    get optionId(): (index: number) => string;
    get results(): AdminResult[];
    get activeIndex(): number;
    get setActive(): (index: number) => void;
    get onPick(): (result: AdminResult) => void;
    get onNavigate(): (url: string) => void;
    get query(): string;
    get mobile(): boolean;
    get nothing(): boolean;
    get runs(): import("./adminSearchIndex").ResultRun[];
    get index(): number;
    get show_case_1(): boolean;
    get part1_props(): {
        listId: string;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<ul id>: attribute(s) without a .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_case_2(): boolean;
    get part2_props(): {
        listId: string;
        t: import("i18next").TFunction<"translation", undefined>;
        props: Readonly<PanelProps>;
        activeIndex: number;
        optionId: (index: number) => string;
        mobile: boolean;
        onPick: (result: AdminResult) => void;
        setActive: (index: number) => void;
    };
    /** A part of the screen still written in React (<ul id>: attribute(s) without a .kbview property). */
    get Part2(): typeof __parts.Part2;
    get show_case_3(): boolean;
    get search_none_title_q(): string;
    get description(): string;
    get show_near_misses(): boolean;
    /** `<Heading>`, rendered by a ReactHost. */
    get Heading(): typeof __parts.Heading;
    get heading_props(): {
        label: string;
    };
    /** `<ResultRow>`, rendered by a ReactHost. */
    get ResultRow(): typeof ResultRow;
    /** The rows of the Repeater over `props.nearMisses`. */
    get rows_near_misses(): {
        r: AdminResult;
        result_row_props: RowProps | undefined;
        key: string;
    }[];
    get show_main(): boolean;
    get part3_props(): {
        listId: string;
        t: import("i18next").TFunction<"translation", undefined>;
        runs: import("./adminSearchIndex").ResultRun[];
        onNavigate: (url: string) => void;
        query: string;
        index: number;
        activeIndex: number;
        optionId: (index: number) => string;
        mobile: boolean;
        onPick: (result: AdminResult) => void;
        setActive: (index: number) => void;
    };
    /** A part of the screen still written in React (<ul id>: attribute(s) without a .kbview property). */
    get Part3(): typeof __parts.Part3;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AdminSearchPanelStores = ReturnType<AdminSearchPanel['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<PanelProps>>;
export default _default;
