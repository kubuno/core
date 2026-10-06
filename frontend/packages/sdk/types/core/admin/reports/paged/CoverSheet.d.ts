import { InstanceLogo } from "../../../shell/InstanceLogo";
import type { ReportModel } from "../model";
import { ViewBase } from './CoverSheet.kbview';
import * as __parts from './CoverSheet.parts';
export type CoverSheetProps = {
    instance: string;
    title: string;
    about: string;
    periodLabel: string;
    generatedAt: string;
    generatedBy: string;
    model: ReportModel;
};
export declare class CoverSheet extends ViewBase {
    tr: CoverSheetStores['t'];
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
    get p_text(): string;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        model: ReportModel;
        generatedAt: string;
        generatedBy: string;
    };
    /** A part of the screen still written in React (<dl> has no .kbview element yet). */
    get Part1(): typeof __parts.Part1;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type CoverSheetStores = ReturnType<CoverSheet['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<CoverSheetProps>>;
export default _default;
