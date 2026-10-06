/**
 * The parts of `RibbonMock.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { RibbonMock } from './RibbonMock';
export declare function Part1({ groupLabel }: {
    groupLabel: NonNullable<RibbonMock['groupLabel']>;
}): import("react").JSX.Element;
export declare function Part2({ sep }: {
    sep: NonNullable<RibbonMock['sep']>;
}): import("react").JSX.Element;
export declare function Part3({ groupLabel }: {
    groupLabel: NonNullable<RibbonMock['groupLabel']>;
}): import("react").JSX.Element;
export declare function Part4({ sep }: {
    sep: NonNullable<RibbonMock['sep']>;
}): import("react").JSX.Element;
export declare function Part5({ groupLabel }: {
    groupLabel: NonNullable<RibbonMock['groupLabel']>;
}): import("react").JSX.Element;
