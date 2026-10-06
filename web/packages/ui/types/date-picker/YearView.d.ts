import { type Dispatch, type SetStateAction } from 'react';
import type { PickerView } from './types';
/** 12-year page. */
export declare function YearView({ viewDate, setViewDate, setView, selected, }: {
    viewDate: Date;
    setViewDate: Dispatch<SetStateAction<Date>>;
    setView: Dispatch<SetStateAction<PickerView>>;
    selected: Date | null;
}): import("react").JSX.Element;
