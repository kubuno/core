import type { ReportModel } from "./model";
import { ViewBase } from './ReportSummary.kbview';
import * as __parts from './ReportSummary.parts';
export type ReportSummaryProps = {
    model: ReportModel;
};
export declare class ReportSummary extends ViewBase {
    tr: ReportSummaryStores['t'];
    i18n: ReportSummaryStores['i18n'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get facts(): string[];
    get peak(): {
        label: string;
        value: number;
    } | null;
    get seriesSum(): number;
    get rising(): boolean;
    get falling(): boolean;
    get tone(): "var(--color-text-secondary)" | "var(--color-success)" | "var(--color-danger)";
    get Arrow(): import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get show_model_snapshot_model(): boolean;
    get part1_props(): {
        tone: "var(--color-text-secondary)" | "var(--color-success)" | "var(--color-danger)";
        Arrow: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        model_delta: number;
        i18n: import("i18next").i18n;
    };
    /** A part of the screen still written in React (<p> with a computed style). */
    get Part1(): typeof __parts.Part1;
    /** A part of the screen still written in React (<span data-tone>: data attributes on a text). */
    get Part2(): typeof __parts.Part2;
    /** The rows of the Repeater over `facts`. */
    get rows_facts(): {
        f: string;
        i: number;
        key: number;
    }[];
    pct(v: number): string;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ReportSummaryStores = ReturnType<ReportSummary['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<ReportSummaryProps>>;
export default _default;
