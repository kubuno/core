export default function CalendarDetail({ calendarId, canManage, onOpenCalendar, }: {
    calendarId: string;
    canManage: boolean;
    onOpenCalendar: (id: string) => void;
}): import("react").JSX.Element;
