import type { NotificationsTab } from './NotificationsTab';
declare function NotifCheck({ checked, onChange }: {
    checked: boolean;
    onChange: () => void;
}): import("react").JSX.Element;
export { NotifCheck };
export declare function Part1({ g, cell, toggle }: {
    g: NotificationsTab['rows_groups'][number]['g'];
    cell: NotificationsTab['cell'];
    toggle: NotificationsTab['toggle'];
}): import("react").JSX.Element;
