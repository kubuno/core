/**
 * The parts of `CompositionBar.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { CompositionBar } from './CompositionBar';
export declare function Part1({ s, safeTotal, i }: {
    s: NonNullable<CompositionBar['rows_visible']>[number]['s'];
    safeTotal: NonNullable<CompositionBar['safeTotal']>;
    i: NonNullable<CompositionBar['rows_visible']>[number]['i'];
}): import("react").JSX.Element;
export declare function Part2({ s }: {
    s: NonNullable<CompositionBar['rows_segments']>[number]['s'];
}): import("react").JSX.Element;
