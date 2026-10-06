import { ViewBase } from './DataGroup.kbview';
import * as __parts from './DataGroup.parts';
export declare class DataGroup extends ViewBase {
    tr: DataGroupStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Block> is no .kbview element (a local or dynamic component)). */
    get Part1(): typeof __parts.Part1;
    /** A part of the screen still written in React (<Block> is no .kbview element (a local or dynamic component)). */
    get Part2(): typeof __parts.Part2;
    /** A part of the screen still written in React (<Block> is no .kbview element (a local or dynamic component)). */
    get Part3(): typeof __parts.Part3;
    /** A part of the screen still written in React (<Block> is no .kbview element (a local or dynamic component)). */
    get Part4(): typeof __parts.Part4;
    /** A part of the screen still written in React (<Block> is no .kbview element (a local or dynamic component)). */
    get Part5(): typeof __parts.Part5;
    /** A part of the screen still written in React (<Block> is no .kbview element (a local or dynamic component)). */
    get Part6(): typeof __parts.Part6;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type DataGroupStores = ReturnType<DataGroup['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
