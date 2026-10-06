import { ViewBase } from './LeftRail.kbview';
import * as __parts from './LeftRail.parts';
export declare class LeftRail extends ViewBase {
    entries: LeftRailStores['entries'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        entries: import("../store/leftRailStore").LeftRailEntry[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get part1_props(): {
        entries: import("../store/leftRailStore").LeftRailEntry[];
    };
    /** A part of the screen still written in React (a list callback destructuring its item). */
    get Part1(): typeof __parts.Part1;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type LeftRailStores = ReturnType<LeftRail['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
