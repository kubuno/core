/**
 * The parts of `Field.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { Field } from './Field';
export declare function Part1({ label }: {
    label: Field['props']['label'];
}): import("react").JSX.Element;
export declare function Part2({ children }: {
    children: Field['props']['children'];
}): import("react").JSX.Element;
