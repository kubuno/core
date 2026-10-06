import { type TabDef } from "@ui";
import type { AdminSectionProps } from "../registry";
import { ViewBase } from './HolidaysSection.kbview';
import * as __parts from './HolidaysSection.parts';
type Pane = 'calendars' | 'units';
export type { AdminSectionProps };
export declare class HolidaysSection extends ViewBase {
    tr: HolidaysSectionStores['t'];
    can: HolidaysSectionStores['can'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../../../authz/types").CanFn;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canManage(): boolean;
    get calendarId(): string | null;
    get pane(): Pane;
    get tabs(): TabDef<Pane>[];
    get show_calendar_id(): boolean;
    /** `<OverviewBar>`, rendered by a ReactHost. */
    get OverviewBar(): import("react").FunctionComponent<Readonly<import("./OverviewBar").OverviewBarProps>>;
    get overview_bar_props(): {
        canManage: boolean;
    };
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        tabs: TabDef<Pane>[];
        pane: Pane;
        go: (next: Pane, calendar?: string | null) => void | Promise<void>;
    };
    /** A part of the screen still written in React (<Tabs> tabs: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_calendar_id2(): boolean;
    get show_not_calendar_id(): boolean;
    /** `<CalendarDetail>`, rendered by a ReactHost. */
    get CalendarDetail(): import("react").FunctionComponent<Readonly<import("./CalendarDetail").CalendarDetailProps>>;
    get calendar_detail_props(): Readonly<import("./CalendarDetail").CalendarDetailProps>;
    get show_pane_units(): boolean;
    get show_not_pane_units(): boolean;
    /** `<UnitsTab>`, rendered by a ReactHost. */
    get UnitsTab(): import("react").FunctionComponent<Readonly<import("./UnitsTab").UnitsTabProps>>;
    get units_tab_props(): {
        canManage: boolean;
    };
    /** `<CalendarsTab>`, rendered by a ReactHost. */
    get CalendarsTab(): import("react").FunctionComponent<Readonly<import("./CalendarsTab").CalendarsTabProps>>;
    get calendars_tab_props(): Readonly<import("./CalendarsTab").CalendarsTabProps>;
    get visible(): boolean;
    get visible2(): boolean;
    go(next: Pane, calendar?: string | null): void | Promise<void>;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type HolidaysSectionStores = ReturnType<HolidaysSection['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
