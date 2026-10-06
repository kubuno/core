import type { Dispatch, SetStateAction } from 'react';
import type { PickerView } from './types';
/** Month grid of the displayed year. */
export declare function MonthView({ viewDate, setViewDate, setView, selected, }: {
    viewDate: Date;
    setViewDate: Dispatch<SetStateAction<Date>>;
    setView: Dispatch<SetStateAction<PickerView>>;
    selected: Date | null;
}): import("react").JSX.Element;
