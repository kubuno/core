/**
 * The parts of `DonutChart.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { DonutChart } from './DonutChart';
export declare function Part1({ size, setHi, r, stroke, total, data, hi, c, offset, active, centerValue, centerLabel }: {
    size: NonNullable<DonutChart['size']>;
    setHi: NonNullable<DonutChart['setHi']>;
    r: NonNullable<DonutChart['r']>;
    stroke: NonNullable<DonutChart['stroke']>;
    total: NonNullable<DonutChart['total']>;
    data: NonNullable<DonutChart['props']['data']>;
    hi: DonutChart['hi'];
    c: NonNullable<DonutChart['c']>;
    offset: NonNullable<DonutChart['offset']>;
    active: NonNullable<DonutChart['active']>;
    centerValue: DonutChart['props']['centerValue'];
    centerLabel: DonutChart['props']['centerLabel'];
}): import("react").JSX.Element;
export declare function Part2({ d }: {
    d: NonNullable<DonutChart['rows_data']>[number]['d'];
}): import("react").JSX.Element;
