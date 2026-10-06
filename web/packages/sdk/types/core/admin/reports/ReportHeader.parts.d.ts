/**
 * The parts of `ReportHeader.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { ReactNode } from "react";
import type { ReportHeader } from './ReportHeader';
declare function Fact({ label, children }: {
    label: string;
    children: ReactNode;
}): import("react").JSX.Element;
export { Fact };
export declare function Part1({ t, periodLabel, model, generatedAt, generatedBy }: {
    t: NonNullable<ReportHeader['tr']>;
    periodLabel: NonNullable<ReportHeader['props']['periodLabel']>;
    model: NonNullable<ReportHeader['props']['model']>;
    generatedAt: NonNullable<ReportHeader['props']['generatedAt']>;
    generatedBy: NonNullable<ReportHeader['props']['generatedBy']>;
}): import("react").JSX.Element;
