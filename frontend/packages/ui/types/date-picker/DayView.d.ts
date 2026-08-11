import type { Dispatch, SetStateAction } from 'react';
import type { PickerView } from './types';
/** Month grid: weekday headers + day cells (single date, or range highlight). */
export declare function DayView({ viewDate, setViewDate, setView, selected, onSelect, setHoverDate, isRange, isDisabled, inRange, isEdge, }: {
    viewDate: Date;
    setViewDate: Dispatch<SetStateAction<Date>>;
    setView: Dispatch<SetStateAction<PickerView>>;
    selected: Date | null;
    onSelect: (d: Date) => void;
    setHoverDate?: (d: Date | null) => void;
    isRange: boolean;
    isDisabled: (d: Date) => boolean;
    inRange: (d: Date) => boolean;
    isEdge: (d: Date) => boolean | null;
}): import("react").JSX.Element;
