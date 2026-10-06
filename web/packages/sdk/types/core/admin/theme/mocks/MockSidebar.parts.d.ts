/**
 * The parts of `MockSidebar.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { MockSidebar } from './MockSidebar';
export declare function Part1({ items }: {
    items: NonNullable<MockSidebar['items']>;
}): import("react").JSX.Element;
