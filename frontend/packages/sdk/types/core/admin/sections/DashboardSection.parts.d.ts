/**
 * The parts of `DashboardSection.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { type ReactNode } from "react";
import { Users } from "lucide-react";
import { type DashboardRetention } from "./dashboard/api";
import type { DashboardSection } from './DashboardSection';
declare function StatCard({ label, value, icon: Icon, tone, accent, children, }: {
    label: string;
    value: ReactNode;
    icon: typeof Users;
    /** A theme token, never a literal: this card is painted in both themes. */
    tone: string;
    accent?: ReactNode;
    children?: ReactNode;
}): import("react").JSX.Element;
export { StatCard };
declare function ReachNotice({ periodId, retention, }: {
    periodId: string;
    retention: DashboardRetention;
}): import("react").JSX.Element | null;
export { ReachNotice };
export declare function Part1({ t, n, stats, activePct }: {
    t: NonNullable<DashboardSection['tr']>;
    n: DashboardSection['n'];
    stats: DashboardSection['stats'];
    activePct: NonNullable<DashboardSection['activePct']>;
}): import("react").JSX.Element;
export declare function Part2({ period, setPeriod, periodOptions }: {
    period: NonNullable<DashboardSection['period']>;
    setPeriod: NonNullable<DashboardSection['setPeriod']>;
    periodOptions: NonNullable<DashboardSection['periodOptions']>;
}): import("react").JSX.Element;
export declare function Part3({ editing, setEditing, t }: {
    editing: NonNullable<DashboardSection['editing']>;
    setEditing: NonNullable<DashboardSection['setEditing']>;
    t: NonNullable<DashboardSection['tr']>;
}): import("react").JSX.Element;
export declare function Part4({ visible, received, bucket, editing, hide, move, openReport, moduleName }: {
    visible: NonNullable<DashboardSection['visible']>;
    received: NonNullable<DashboardSection['received']>;
    bucket: NonNullable<DashboardSection['bucket']>;
    editing: NonNullable<DashboardSection['editing']>;
    hide: NonNullable<DashboardSection['hide']>;
    move: NonNullable<DashboardSection['move']>;
    openReport: NonNullable<DashboardSection['openReport']>;
    moduleName: NonNullable<DashboardSection['moduleName']>;
}): import("react").JSX.Element;
export declare function Part5({ t, reset }: {
    t: NonNullable<DashboardSection['tr']>;
    reset: NonNullable<DashboardSection['reset']>;
}): import("react").JSX.Element;
export declare function Part6({ hiddenAvailable, show, visible, t }: {
    hiddenAvailable: NonNullable<DashboardSection['hiddenAvailable']>;
    show: NonNullable<DashboardSection['show']>;
    visible: NonNullable<DashboardSection['visible']>;
    t: NonNullable<DashboardSection['tr']>;
}): import("react").JSX.Element;
