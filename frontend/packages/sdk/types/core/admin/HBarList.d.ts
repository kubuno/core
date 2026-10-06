/**
 * Code-behind of `HBarList.kbview` (converted from `HBarList.tsx` by @kubuno/views-migrate).
 */
import { ViewBase } from './HBarList.kbview';
import * as __parts from './HBarList.parts';
export type HBarListProps = {
    /** `color` per item overrides the list's own — a printed report ties each bar
        to the slice and to the table row that carry the same entry. */
    items: {
        label: string;
        value: number;
        max: number;
        sub?: string;
        color?: string;
    }[];
    color?: string;
    /** Paints a nearly-full bar in the danger colour. Right when `max` is a LIMIT
        (a quota being consumed), wrong when it is merely the largest value in the
        list: the leader of a ranking would then always be red, and red would be
        saying "problem" about the most-used room, which is good news. */
    warnFull?: boolean;
};
export declare class HBarList extends ViewBase {
    get color(): string;
    get warnFull(): boolean;
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part1(): typeof __parts.Part1;
    /** The rows of the Repeater over `items`. */
    get rows_items(): {
        it: {
            label: string;
            value: number;
            max: number;
            sub?: string;
            color?: string;
        };
        i: number;
        pct: number;
        over: boolean;
        tooltip: string;
        part1_props: {
            pct: number;
            over: boolean;
            it: {
                label: string;
                value: number;
                max: number;
                sub?: string;
                color?: string;
            };
            color: string;
        };
        key: number;
    }[];
}
declare const _default: import("react").FunctionComponent<Readonly<HBarListProps>>;
export default _default;
