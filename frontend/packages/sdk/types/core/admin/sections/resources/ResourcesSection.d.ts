import { type TabDef } from "@ui";
import type { AdminSectionProps } from "../registry";
import { type ResourcePane } from "./panes";
import { ViewBase } from './ResourcesSection.kbview';
import * as __parts from './ResourcesSection.parts';
export type { AdminSectionProps };
export declare class ResourcesSection extends ViewBase {
    tr: ResourcesSectionStores['t'];
    can: ResourcesSectionStores['can'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../../../authz/types").CanFn;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canManage(): boolean;
    get pane(): ResourcePane;
    get tabs(): TabDef<ResourcePane>[];
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        tabs: TabDef<ResourcePane>[];
        pane: ResourcePane;
        go: (next: ResourcePane) => void | Promise<void>;
    };
    /** A part of the screen still written in React (<Tabs> tabs: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_pane_overview(): boolean;
    /** `<OverviewTab>`, rendered by a ReactHost. */
    get OverviewTab(): import("react").FunctionComponent<Readonly<import("./OverviewTab").OverviewTabProps>>;
    get overview_tab_props(): {
        onGo: (next: ResourcePane) => void | Promise<void>;
    };
    get show_pane_buildings(): boolean;
    /** `<BuildingsTab>`, rendered by a ReactHost. */
    get BuildingsTab(): import("react").FunctionComponent<Readonly<import("./BuildingsTab").BuildingsTabProps>>;
    get buildings_tab_props(): {
        canManage: boolean;
    };
    get show_pane_resources(): boolean;
    /** `<ResourcesTab>`, rendered by a ReactHost. */
    get ResourcesTab(): import("react").FunctionComponent<Readonly<import("./ResourcesTab").ResourcesTabProps>>;
    get resources_tab_props(): {
        canManage: boolean;
    };
    get show_pane_features(): boolean;
    /** `<FeaturesTab>`, rendered by a ReactHost. */
    get FeaturesTab(): import("react").FunctionComponent<Readonly<import("./FeaturesTab").FeaturesTabProps>>;
    get features_tab_props(): {
        canManage: boolean;
    };
    get show_pane_room_stats(): boolean;
    /** `<RoomStatsTab>`, rendered by a ReactHost. */
    get RoomStatsTab(): import("react").FunctionComponent<Readonly<{}>>;
    go(next: ResourcePane): void | Promise<void>;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ResourcesSectionStores = ReturnType<ResourcesSection['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
