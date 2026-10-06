import type { AdminSectionProps } from "../sections/registry";
import { ViewBase } from './ReportsSection.kbview';
import * as __parts from './ReportsSection.parts';
export type { AdminSectionProps };
export declare class ReportsSection extends ViewBase {
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get panelId(): string;
    get asked(): string | null;
    get found(): import("../panels/catalog").CataloguedPanel | null;
    get show_case_1(): boolean;
    /** `<ReportIndex>`, rendered by a ReactHost. */
    get ReportIndex(): typeof __parts.ReportIndex;
    get report_index_props(): {
        navigate: import("react-router").NavigateFunction;
    };
    get show_case_2(): boolean;
    get show_main(): boolean;
    /** `<OneReport>`, rendered by a ReactHost. */
    get OneReport(): typeof __parts.OneReport;
    get one_report_props(): {
        source: import("../panels/report").PanelSource;
        panelId: string;
        def: import("../panels/types").PanelDef;
        params: URLSearchParams;
        navigate: import("react-router").NavigateFunction;
    };
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ReportsSectionStores = ReturnType<ReportsSection['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
