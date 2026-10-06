/**
 * The parts of `RuleSentence.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { RuleSentence } from './RuleSentence';
export declare function Part1({ parts }: {
    parts: NonNullable<RuleSentence['parts']>;
}): import("react").JSX.Element;
