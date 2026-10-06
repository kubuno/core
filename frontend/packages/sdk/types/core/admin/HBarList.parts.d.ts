/**
 * The parts of `HBarList.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { HBarList } from './HBarList';
export declare function Part1({ pct, over, it, color }: {
    pct: NonNullable<HBarList['rows_items']>[number]['pct'];
    over: NonNullable<HBarList['rows_items']>[number]['over'];
    it: NonNullable<HBarList['rows_items']>[number]['it'];
    color: NonNullable<HBarList['color']>;
}): import("react").JSX.Element;
