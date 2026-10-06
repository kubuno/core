/**
 * Code-behind of `DonutChart.kbview` (converted from `DonutChart.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { ViewBase } from './DonutChart.kbview';
import * as __parts from './DonutChart.parts';
export type DonutChartProps = {
    data: {
        label: string;
        value: number;
        color: string;
    }[];
    centerValue?: string;
    centerLabel?: string;
    size?: number;
};
export declare class DonutChart extends ViewBase {
    accessor hi: number | null;
    get size(): number;
    get total(): number;
    get stroke(): 18;
    get r(): number;
    get c(): number;
    get offset(): number;
    get active(): {
        label: string;
        value: number;
        color: string;
    } | null;
    get part1_props(): {
        size: number;
        setHi: (value: number | null | ((prev: number | null) => number | null)) => void;
        r: number;
        stroke: 18;
        total: number;
        data: {
            label: string;
            value: number;
            color: string;
        }[];
        hi: number | null;
        c: number;
        offset: number;
        active: {
            label: string;
            value: number;
            color: string;
        } | null;
        centerValue: string | undefined;
        centerLabel: string | undefined;
    };
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part1(): typeof __parts.Part1;
    /** A part of the screen still written in React (<span> with a computed style). */
    get Part2(): typeof __parts.Part2;
    /** The rows of the Repeater over `data`. */
    get rows_data(): {
        d: {
            label: string;
            value: number;
            color: string;
        };
        i: number;
        li_class: string;
        part2_props: {
            d: {
                label: string;
                value: number;
                color: string;
            };
        };
        span_text: string;
        key: number;
    }[];
    panel_mouse_enter(_sender: unknown, args: MouseEventArgs): void;
    panel_mouse_leave(_sender: unknown, _args: MouseEventArgs): void;
    /** `setHi` of the TSX: a value, or an update of the previous one. */
    setHi(value: number | null | ((prev: number | null) => number | null)): void;
}
declare const _default: import("react").FunctionComponent<Readonly<DonutChartProps>>;
export default _default;
