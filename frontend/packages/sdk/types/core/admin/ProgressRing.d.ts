/**
 * Code-behind of `ProgressRing.kbview` (converted from `ProgressRing.tsx` by @kubuno/views-migrate).
 */
import { ViewBase } from './ProgressRing.kbview';
import * as __parts from './ProgressRing.parts';
export type ProgressRingProps = {
    pct: number;
    label?: string;
    value: string;
    sub?: string;
    color?: string;
    size?: number;
};
export declare class ProgressRing extends ViewBase {
    get color(): string;
    get size(): number;
    get stroke(): 12;
    get r(): number;
    get c(): number;
    get clamped(): number;
    get part1_props(): {
        size: number;
        r: number;
        stroke: 12;
        color: string;
        c: number;
        clamped: number;
        value: string;
        label: string | undefined;
    };
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part1(): typeof __parts.Part1;
    get show_sub(): boolean;
}
declare const _default: import("react").FunctionComponent<Readonly<ProgressRingProps>>;
export default _default;
