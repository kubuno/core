export default function CalendarDetail({ calendarId, canManage, onBack, onOpenCalendar, }: {
    calendarId: string;
    canManage: boolean;
    onBack: () => void;
    onOpenCalendar: (id: string) => void;
}): import("react").JSX.Element;
