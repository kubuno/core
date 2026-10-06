import { type Alert, type AlertEvent } from "./types";
import type { AlertDetail } from './AlertDetail';
declare function ActionButtons({ alert, onExecute, busy }: {
    alert: Alert;
    onExecute: (verb: 'retry-jobs' | 'discard-jobs') => void;
    busy: boolean;
}): import("react").JSX.Element | null;
export { ActionButtons };
declare function Timeline({ events }: {
    events: AlertEvent[];
}): import("react").JSX.Element;
export { Timeline };
declare function Row({ label, value }: {
    label: string;
    value: string;
}): import("react").JSX.Element;
export { Row };
export declare function Part1({ alert, assign, toast, t, assigneeOptions }: {
    alert: NonNullable<AlertDetail['alert']>;
    assign: NonNullable<AlertDetail['assign']>;
    toast: NonNullable<AlertDetail['toast']>;
    t: NonNullable<AlertDetail['tr']>;
    assigneeOptions: NonNullable<AlertDetail['assigneeOptions']>;
}): import("react").JSX.Element;
export declare function Part2({ draft, setDraft, t }: {
    draft: NonNullable<AlertDetail['draft']>;
    setDraft: NonNullable<AlertDetail['setDraft']>;
    t: NonNullable<AlertDetail['tr']>;
}): import("react").JSX.Element;
export declare function Part3({ t, alert, i18n, alert_module_id, alert_subject_label, alert_assignee_label, alert_closed_at }: {
    t: NonNullable<AlertDetail['tr']>;
    alert: NonNullable<AlertDetail['alert']>;
    i18n: NonNullable<AlertDetail['i18n']>;
    alert_module_id: string;
    alert_subject_label: string;
    alert_assignee_label: string;
    alert_closed_at: string;
}): import("react").JSX.Element;
export declare function Part4({ r, t }: {
    r: NonNullable<AlertDetail['rows_related']>[number]['r'];
    t: NonNullable<AlertDetail['tr']>;
}): import("react").JSX.Element;
