import { type Holiday } from './api';
export default function HolidayDialog({ calendarId, holiday, onClose, }: {
    calendarId: string;
    /** `null` creates. */
    holiday: Holiday | null;
    onClose: () => void;
}): import("react").JSX.Element;
