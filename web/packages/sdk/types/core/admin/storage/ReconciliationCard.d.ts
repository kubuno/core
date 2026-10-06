import type { ModuleUsage, Reconciliation } from "./api";
import { ViewBase } from './ReconciliationCard.kbview';
import * as __parts from './ReconciliationCard.parts';
export type ReconciliationCardProps = {
    data: Reconciliation;
    /** Only to put a display name on a blocking module id. */
    modules: ModuleUsage[];
    staleHours: number;
};
export declare class ReconciliationCard extends ViewBase {
    tr: ReconciliationCardStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get blocks(): import("./api").ReconciliationBlock[];
    get held(): import("./api").HeldBackAccount[];
    get variant(): "default" | "success";
    get badge_text(): string;
    get p_text(): string;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        data: Reconciliation;
    };
    /** A part of the screen still written in React (<Figure> is no .kbview element (./Figure#default)). */
    get Part1(): typeof __parts.Part1;
    /** A part of the screen still written in React (<Figure> is no .kbview element (./Figure#default)). */
    get Part2(): typeof __parts.Part2;
    /** A part of the screen still written in React (<Figure> is no .kbview element (./Figure#default)). */
    get Part3(): typeof __parts.Part3;
    /** A part of the screen still written in React (<Figure> is no .kbview element (./Figure#default)). */
    get Part4(): typeof __parts.Part4;
    get show_blocks(): boolean;
    /** The rows of the Repeater over `blocks`. */
    get rows_blocks(): {
        b: import("./api").ReconciliationBlock;
        i: number;
        span_text: string | undefined;
        p_text: string | undefined;
        key: string;
    }[];
    get show_held(): boolean;
    get part5_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        held: import("./api").HeldBackAccount[];
    };
    /** A part of the screen still written in React (<Callout> with element children). */
    get Part5(): typeof __parts.Part5;
    get show_blocks_held_data(): boolean;
    nameOf(id: string): string;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ReconciliationCardStores = ReturnType<ReconciliationCard['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<ReconciliationCardProps>>;
export default _default;
