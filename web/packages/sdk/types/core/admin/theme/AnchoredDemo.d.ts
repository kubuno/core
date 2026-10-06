import { ViewBase } from './AnchoredDemo.kbview';
import * as __parts from './AnchoredDemo.parts';
export declare class AnchoredDemo extends ViewBase {
    ref: AnchoredDemoStores['ref'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        ref: import("react").RefObject<HTMLButtonElement | null>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get part1_props(): {
        ref: import("react").RefObject<HTMLButtonElement | null>;
    };
    /** A part of the screen still written in React (<button ref>: attribute(s) without a .kbview property). */
    get Part1(): typeof __parts.Part1;
    /** A part of the screen still written in React (<Popover> anchorRef: a value the property converts (element-ref)). */
    get Part2(): typeof __parts.Part2;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AnchoredDemoStores = ReturnType<AnchoredDemo['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
