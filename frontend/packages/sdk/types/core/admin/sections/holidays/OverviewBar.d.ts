import { ViewBase } from './OverviewBar.kbview';
import * as __parts from './OverviewBar.parts';
export type OverviewBarProps = {
    canManage: boolean;
};
export declare class OverviewBar extends ViewBase {
    accessor error: string | null;
    tr: OverviewBarStores['t'];
    data: OverviewBarStores['data'];
    reload: OverviewBarStores['reload'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        data: NoInfer<import("./api").HolidaysOverview> | undefined;
        reload: import("@tanstack/react-query").UseMutationResult<any, Error, void, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get stale(): boolean;
    get show_case_1(): boolean;
    get show_main(): boolean;
    /** `<Figure>`, rendered by a ReactHost. */
    get Figure(): typeof __parts.Figure;
    get figure_props(): {
        value: number;
        label: string;
    };
    get figure_props2(): {
        value: number;
        label: string;
    };
    get figure_props3(): {
        value: number;
        label: string;
    };
    get figure_props4(): {
        value: number;
        label: string;
    };
    get hol_dataset_version(): string;
    get part1_props(): {
        reload: import("@tanstack/react-query").UseMutationResult<any, Error, void, unknown>;
        setError: (value: string | null | ((prev: string | null) => string | null)) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part1(): typeof __parts.Part1;
    get hol_dataset_stale_version(): string;
    get show_data_orphans(): boolean;
    get hol_orphans_count(): number;
    get show_error(): boolean;
    /** `setError` of the TSX: a value, or an update of the previous one. */
    setError(value: string | null | ((prev: string | null) => string | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type OverviewBarStores = ReturnType<OverviewBar['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<OverviewBarProps>>;
export default _default;
