import type { ReactNode } from 'react';
/** date → "YYYY-MM-DD" | time → "HH:mm" | datetime → "YYYY-MM-DDTHH:mm" | daterange → startValue/endValue */
export type DatePickerMode = 'date' | 'time' | 'datetime' | 'daterange';
/** Which grid the calendar currently shows. */
export type PickerView = 'day' | 'month' | 'year';
export interface DatePickerProps {
    mode?: DatePickerMode;
    /** Single-value modes: controlled value (ISO) */
    value?: string | null;
    onChange?: (v: string | null) => void;
    /** Range mode – start "YYYY-MM-DD" */
    startValue?: string | null;
    /** Range mode – end "YYYY-MM-DD" */
    endValue?: string | null;
    onRangeChange?: (start: string | null, end: string | null) => void;
    label?: ReactNode;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    /** Show an × button to clear the value */
    clearable?: boolean;
    required?: boolean;
    error?: string;
    hint?: string;
    /** Earliest selectable date "YYYY-MM-DD" */
    minDate?: string;
    /** Latest selectable date "YYYY-MM-DD" */
    maxDate?: string;
    /** Return true to disable a specific date */
    disabledDate?: (d: Date) => boolean;
    /** Minute step in time picker (default 5) */
    minuteStep?: number;
    size?: 'sm' | 'md';
    className?: string;
    id?: string;
    name?: string;
}
