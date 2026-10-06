/**
 * The parts of `OverviewTab.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { ReactNode } from "react";
declare function Stat({ icon, value, label }: {
    icon: ReactNode;
    value: number;
    label: string;
}): import("react").JSX.Element;
export { Stat };
