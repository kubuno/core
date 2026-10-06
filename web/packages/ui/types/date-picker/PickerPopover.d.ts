import type React from 'react';
import type { Dispatch, ReactNode, RefObject, SetStateAction } from 'react';
import type { PickerView } from './types';
/**
 * Floating panel of the picker: calendar, time columns and the footer used by
 * the time-bearing modes. Purely presentational — every value and handler is
 * owned by `DatePicker`.
 */
export declare function PickerPopover({ popRef, pos, width, showCalendar, showTime, viewDate, setViewDate, view, setView, selected, onSelectDate, rangeStart, rangeEnd, hoverDate, setHoverDate, isRange, minDate, maxDate, disabledDate, hourValues, minuteValues, hours, minutes, onHours, onMinutes, showClear, onClear, onConfirm, dayPanel, }: {
    popRef: RefObject<HTMLDivElement | null>;
    pos: {
        top: number;
        left: number;
    };
    width: number;
    showCalendar: boolean;
    showTime: boolean;
    viewDate: Date;
    setViewDate: Dispatch<SetStateAction<Date>>;
    view: PickerView;
    setView: Dispatch<SetStateAction<PickerView>>;
    selected: Date | null;
    onSelectDate: (d: Date) => void;
    rangeStart?: Date | null;
    rangeEnd?: Date | null;
    hoverDate?: Date | null;
    setHoverDate?: (d: Date | null) => void;
    isRange: boolean;
    minDate?: string;
    maxDate?: string;
    disabledDate?: (d: Date) => boolean;
    hourValues: number[];
    minuteValues: number[];
    hours: number;
    minutes: number;
    onHours: (h: number) => void;
    onMinutes: (m: number) => void;
    showClear: boolean;
    onClear: (e: React.MouseEvent) => void;
    onConfirm: () => void;
    /** Optional right-hand column (calendar module: the focused day's events/tasks). */
    dayPanel?: ReactNode;
}): React.JSX.Element;
