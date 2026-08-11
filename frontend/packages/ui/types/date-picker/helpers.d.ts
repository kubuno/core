import type { DatePickerMode } from './types';
export declare const WEEKDAYS: string[];
export declare const MONTHS_FR: string[];
/** Parse a controlled value (ISO date/time) into a Date, `null` when unusable. */
export declare function parseDateValue(v: string | null | undefined, mode: DatePickerMode): Date | null;
/** Human-readable text shown in the trigger button. */
export declare function formatDisplay(d: Date | null, mode: DatePickerMode): string;
/** Serialize a Date back to the ISO shape expected by the caller. */
export declare function toISOValue(d: Date | null, mode: DatePickerMode): string | null;
/** Full 6-week grid (monday-first) covering the given month. */
export declare function calendarGrid(month: Date): Date[];
/** 12-year page containing `anchor`. */
export declare function yearGrid(anchor: number): number[];
export declare function computePos(trigger: HTMLElement, popH: number, popW: number): {
    top: number;
    left: number;
};
/** Popover width/height used both for positioning and rendering. */
export declare function popoverSize(mode: DatePickerMode): {
    w: number;
    h: number;
};
