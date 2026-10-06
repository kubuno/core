import { InstanceLogo } from "../../shell/InstanceLogo";
import type { ReportModel } from "./model";
import { ViewBase } from './ReportHeader.kbview';
import * as __parts from './ReportHeader.parts';
export type ReportHeaderProps = {
    /** What the instance calls itself, or its host name as a last resort. */
    instance: string;
    title: string;
    about: string;
    /** The window's own name — "30 derniers jours", "mois dernier". */
    periodLabel: string;
    generatedAt: string;
    generatedBy: string;
    model: ReportModel;
};
export declare class ReportHeader extends ViewBase {
    tr: ReportHeaderStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    /** `<InstanceLogo>`, rendered by a ReactHost. */
    get InstanceLogo(): typeof InstanceLogo;
    get instance_logo_props(): {
        size: number;
        className: string;
    };
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        periodLabel: string;
        model: ReportModel;
        generatedAt: string;
        generatedBy: string;
    };
    /** A part of the screen still written in React (<dl> has no .kbview element yet). */
    get Part1(): typeof __parts.Part1;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ReportHeaderStores = ReturnType<ReportHeader['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<ReportHeaderProps>>;
export default _default;
