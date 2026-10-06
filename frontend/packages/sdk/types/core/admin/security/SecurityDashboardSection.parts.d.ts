import type { SecurityDashboardSection } from './SecurityDashboardSection';
declare function RetentionNotice({ periodId, retention, }: {
    periodId: string;
    retention: {
        audit_days: number;
        alerts_days: number;
        rule_executions_days: number;
    };
}): import("react").JSX.Element | null;
export { RetentionNotice };
export declare function Part1({ period, setPeriod, periodOptions }: {
    period: NonNullable<SecurityDashboardSection['period']>;
    setPeriod: NonNullable<SecurityDashboardSection['setPeriod']>;
    periodOptions: NonNullable<SecurityDashboardSection['periodOptions']>;
}): import("react").JSX.Element;
export declare function Part2({ editing, setEditing, t }: {
    editing: NonNullable<SecurityDashboardSection['editing']>;
    setEditing: NonNullable<SecurityDashboardSection['setEditing']>;
    t: NonNullable<SecurityDashboardSection['tr']>;
}): import("react").JSX.Element;
export declare function Part3({ visible, received, bucket, editing, hide, move, openReport }: {
    visible: NonNullable<SecurityDashboardSection['visible']>;
    received: NonNullable<SecurityDashboardSection['received']>;
    bucket: NonNullable<SecurityDashboardSection['bucket']>;
    editing: NonNullable<SecurityDashboardSection['editing']>;
    hide: NonNullable<SecurityDashboardSection['hide']>;
    move: NonNullable<SecurityDashboardSection['move']>;
    openReport: NonNullable<SecurityDashboardSection['openReport']>;
}): import("react").JSX.Element;
export declare function Part4({ t, reset }: {
    t: NonNullable<SecurityDashboardSection['tr']>;
    reset: NonNullable<SecurityDashboardSection['reset']>;
}): import("react").JSX.Element;
export declare function Part5({ hiddenAvailable, show, visible, t }: {
    hiddenAvailable: NonNullable<SecurityDashboardSection['hiddenAvailable']>;
    show: NonNullable<SecurityDashboardSection['show']>;
    visible: NonNullable<SecurityDashboardSection['visible']>;
    t: NonNullable<SecurityDashboardSection['tr']>;
}): import("react").JSX.Element;
