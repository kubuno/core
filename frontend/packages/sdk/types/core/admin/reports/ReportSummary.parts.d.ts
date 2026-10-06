/**
 * The parts of `ReportSummary.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { ReportSummary } from './ReportSummary';
export declare function Part1({ tone, Arrow, model_delta, i18n }: {
    tone: NonNullable<ReportSummary['tone']>;
    Arrow: NonNullable<ReportSummary['Arrow']>;
    model_delta: number;
    i18n: NonNullable<ReportSummary['i18n']>;
}): import("react").JSX.Element;
export declare function Part2(): import("react").JSX.Element;
