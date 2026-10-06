import { ViewBase } from './OverlaysGroup.kbview';
import * as __parts from './OverlaysGroup.parts';
export declare class OverlaysGroup extends ViewBase {
    tr: OverlaysGroupStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<PreviewStage> is no .kbview element (../PreviewStage#default)). */
    get Part1(): typeof __parts.Part1;
    /** A part of the screen still written in React (<PreviewStage> is no .kbview element (../PreviewStage#default)). */
    get Part2(): typeof __parts.Part2;
    /** A part of the screen still written in React (<PreviewStage> is no .kbview element (../PreviewStage#default)). */
    get Part3(): typeof __parts.Part3;
    /** A part of the screen still written in React (<PreviewStage> is no .kbview element (../PreviewStage#default)). */
    get Part4(): typeof __parts.Part4;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type OverlaysGroupStores = ReturnType<OverlaysGroup['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
