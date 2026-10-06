/**
 * The parts of `ProgressRing.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { ProgressRing } from './ProgressRing';
export declare function Part1({ size, r, stroke, color, c, clamped, value, label }: {
    size: NonNullable<ProgressRing['size']>;
    r: NonNullable<ProgressRing['r']>;
    stroke: NonNullable<ProgressRing['stroke']>;
    color: NonNullable<ProgressRing['color']>;
    c: NonNullable<ProgressRing['c']>;
    clamped: NonNullable<ProgressRing['clamped']>;
    value: NonNullable<ProgressRing['props']['value']>;
    label: NonNullable<ProgressRing['props']['label']>;
}): import("react").JSX.Element;
