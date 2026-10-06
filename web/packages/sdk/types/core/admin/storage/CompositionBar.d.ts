/**
 * Code-behind of `CompositionBar.kbview` (converted from `CompositionBar.tsx` by @kubuno/views-migrate).
 */
import { formatBytes } from "../sections/format";
import { type Segment } from "./charts";
import { ViewBase } from './CompositionBar.kbview';
import * as __parts from './CompositionBar.parts';
export type CompositionBarProps = {
    segments: Segment[];
    total: number;
    ariaLabel: string;
    format?: (n: number) => string;
};
export declare class CompositionBar extends ViewBase {
    get format(): typeof formatBytes;
    get safeTotal(): number;
    get visible(): Segment[];
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part1(): typeof __parts.Part1;
    /** The rows of the Repeater over `visible`. */
    get rows_visible(): {
        s: Segment;
        i: number;
        part1_props: {
            s: Segment;
            safeTotal: number;
            i: number;
        };
        key: string;
    }[];
    /** A part of the screen still written in React (<span> with a computed style). */
    get Part2(): typeof __parts.Part2;
    /** The rows of the Repeater over `segments`. */
    get rows_segments(): {
        s: Segment;
        part2_props: {
            s: Segment;
        };
        span_text: string;
        key: string;
    }[];
}
declare const _default: import("react").FunctionComponent<Readonly<CompositionBarProps>>;
export default _default;
