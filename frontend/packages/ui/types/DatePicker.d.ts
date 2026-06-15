import React from 'react';
/** date → "YYYY-MM-DD" | time → "HH:mm" | datetime → "YYYY-MM-DDTHH:mm" | daterange → startValue/endValue */
export type DatePickerMode = 'date' | 'time' | 'datetime' | 'daterange';
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
    label?: React.ReactNode;
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
export declare function DatePicker({ mode, value, onChange, startValue, endValue, onRangeChange, label, placeholder, disabled, readOnly, clearable, required, error, hint, minDate, maxDate, disabledDate, minuteStep, size, className, id, name, }: DatePickerProps): React.JSX.Element;
