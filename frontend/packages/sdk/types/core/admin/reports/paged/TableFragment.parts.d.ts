/**
 * The parts of `TableFragment.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { TableFragment } from './TableFragment';
export declare function Part1({ item, widths, from, to, last, item_foot }: {
    item: NonNullable<TableFragment['props']['item']>;
    widths: NonNullable<TableFragment['props']['widths']>;
    from: NonNullable<TableFragment['from']>;
    to: NonNullable<TableFragment['to']>;
    last: NonNullable<TableFragment['last']>;
    item_foot: NonNullable<NonNullable<TableFragment['props']['item']>['foot']>;
}): import("react").JSX.Element;
