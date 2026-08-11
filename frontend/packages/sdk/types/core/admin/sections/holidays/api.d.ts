export declare const OVERVIEW_KEY: readonly ["admin-holidays-overview"];
export declare const CALENDARS_KEY: readonly ["admin-holiday-calendars"];
export declare const CALENDAR_KEY: readonly ["admin-holiday-calendar"];
/** The rule grammar, mirroring `holidays::model::Rule` server-side. */
export type RuleKind = 'fixed' | 'easter' | 'nth_weekday' | 'dates';
export type Observance = 'none' | 'next_workday' | 'nearest_workday' | 'sunday_to_monday' | 'saturday_to_monday' | 'saturday_to_friday';
export type Category = 'public' | 'bank' | 'government' | 'school' | 'optional' | 'half_day' | 'armed_forces' | 'workday' | 'observance';
export interface RuleParams {
    month?: number;
    day?: number;
    offset?: number;
    basis?: 'gregorian' | 'julian';
    weekday?: number;
    nth?: number;
    dates?: string[];
}
export interface HolidayCalendar {
    id: string;
    code: string;
    country_code: string | null;
    subdivision: string | null;
    parent_id: string | null;
    name: string;
    names: Record<string, string>;
    is_builtin: boolean;
    enabled: boolean;
    coverage_from: number | null;
    coverage_to: number | null;
}
export interface CalendarSummary extends HolidayCalendar {
    holiday_count: number;
    inherited_count: number;
    overridden_count: number;
    subdivision_count: number;
    /** The name in the console's language — what the list sorts and shows. */
    display_name: string;
}
export interface HolidayDate {
    date: string;
    observed_from: string | null;
}
export interface Holiday {
    id: string;
    calendar_id: string;
    key: string;
    name: string;
    display_name: string;
    names: Record<string, string>;
    category: Category;
    kind: RuleKind;
    rule: RuleParams;
    observance: Observance;
    from_year: number | null;
    to_year: number | null;
    color: string | null;
    enabled: boolean;
    is_builtin: boolean;
    is_overridden: boolean;
    is_orphan: boolean;
    /** Comes from the country calendar, not from this one. */
    inherited: boolean;
    /** This regional calendar explicitly does not observe it. */
    excluded: boolean;
    /** What the rule produces in the previewed year. */
    dates: HolidayDate[];
}
export interface CalendarDetail {
    calendar: HolidayCalendar;
    display_name: string;
    parent: {
        id: string;
        code: string;
        name: string;
    } | null;
    year: number;
    holidays: Holiday[];
    exclusions: string[];
}
export interface HolidaysOverview {
    calendars: number;
    countries: number;
    disabled_calendars: number;
    holidays: number;
    overridden: number;
    custom: number;
    orphans: number;
    unit_prefs: number;
    dataset_loaded: string | null;
    dataset_shipped: string;
}
export declare function useHolidaysOverview(): import("@tanstack/react-query").UseQueryResult<NoInfer<HolidaysOverview>, Error>;
export declare function useHolidayCalendars(search: string, countriesOnly: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<CalendarSummary[]>, Error>;
export declare function useCalendarDetail(id: string | null, year: number): import("@tanstack/react-query").UseQueryResult<NoInfer<CalendarDetail>, Error>;
export interface HolidayInput {
    name: string;
    names?: Record<string, string>;
    category: Category;
    kind: RuleKind;
    rule: RuleParams;
    observance: Observance;
    from_year: number | null;
    to_year: number | null;
    color: string | null;
}
export declare function useCreateHoliday(calendarId: string): import("@tanstack/react-query").UseMutationResult<any, Error, HolidayInput, unknown>;
export declare function useUpdateHoliday(): import("@tanstack/react-query").UseMutationResult<any, Error, {
    id: string;
    input: HolidayInput;
}, unknown>;
export declare function useSetHolidayEnabled(): import("@tanstack/react-query").UseMutationResult<any, Error, {
    id: string;
    enabled: boolean;
}, unknown>;
export declare function useDeleteHoliday(): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare function useResetHoliday(): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare function useSetCalendarEnabled(): import("@tanstack/react-query").UseMutationResult<any, Error, {
    id: string;
    enabled: boolean;
}, unknown>;
export declare function useRenameCalendar(): import("@tanstack/react-query").UseMutationResult<any, Error, {
    id: string;
    name: string;
}, unknown>;
export declare function useCreateCalendar(): import("@tanstack/react-query").UseMutationResult<{
    id: string;
    code: string;
}, Error, {
    name: string;
    code?: string;
    country_code?: string;
}, unknown>;
export declare function useDeleteCalendar(): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
/** The whole exclusion set of a regional calendar, never a delta. */
export declare function useSetExclusions(calendarId: string): import("@tanstack/react-query").UseMutationResult<any, Error, string[], unknown>;
export declare function useReloadDataset(): import("@tanstack/react-query").UseMutationResult<any, Error, void, unknown>;
export interface PreviewDate {
    year: number;
    date: string;
    observed_from: string | null;
}
/**
 * The dates a rule being written produces — computed by the server.
 *
 * Deliberately not reimplemented in TypeScript: the expander *is* the definition
 * of what a rule means, and a second implementation here would be a second
 * answer, free to disagree with the one that actually feeds the modules.
 */
export declare function usePreviewRule(): import("@tanstack/react-query").UseMutationResult<PreviewDate[], Error, {
    kind: RuleKind;
    rule: RuleParams;
    observance: Observance;
    years?: number[];
}, unknown>;
/** The organisational-unit overlay. */
export interface UnitPref {
    id: string;
    calendar_id: string | null;
    holiday_id: string | null;
    enabled: boolean;
    calendar_code: string | null;
    calendar_name: string | null;
    holiday_name: string | null;
    holiday_calendar_code: string | null;
}
export declare function useUnitOverlay(unitId: string | null): import("@tanstack/react-query").UseQueryResult<NoInfer<UnitPref[]>, Error>;
export declare function useSetUnitPref(unitId: string): import("@tanstack/react-query").UseMutationResult<any, Error, {
    calendar_id?: string;
    holiday_id?: string;
    enabled: boolean | null;
}, unknown>;
/** The server's message when it has one — it is more specific than ours. */
export declare function errorMessage(err: unknown, fallback: string): string;
