import { type Dispatch, type SetStateAction } from 'react';
import type { PickerView } from './types';
/**
 * Calendar body of the picker: owns the day/month/year switching and the
 * range/disabled predicates shared by the day grid.
 */
export declare function CalendarView({ viewDate, setViewDate, view, setView, selected, onSelect, rangeStart, rangeEnd, hoverDate, setHoverDate, isRange, minDate, maxDate, disabledDate, }: {
    viewDate: Date;
    setViewDate: Dispatch<SetStateAction<Date>>;
    view: PickerView;
    setView: Dispatch<SetStateAction<PickerView>>;
    selected: Date | null;
    onSelect: (d: Date) => void;
    rangeStart?: Date | null;
    rangeEnd?: Date | null;
    hoverDate?: Date | null;
    setHoverDate?: (d: Date | null) => void;
    isRange: boolean;
    minDate?: string;
    maxDate?: string;
    disabledDate?: (d: Date) => boolean;
}): import("react").JSX.Element;
