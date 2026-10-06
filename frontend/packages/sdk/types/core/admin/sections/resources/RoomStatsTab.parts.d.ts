/**
 * The parts of `RoomStatsTab.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { type ReactNode } from "react";
import { Clock } from "lucide-react";
import type { RoomStatsTab } from './RoomStatsTab';
declare function StatCard({ label, value, icon: Icon, accent, }: {
    label: string;
    value: ReactNode;
    icon: typeof Clock;
    accent?: ReactNode;
}): import("react").JSX.Element;
export { StatCard };
declare function ChartCard({ title, children }: {
    title: string;
    children: ReactNode;
}): import("react").JSX.Element;
export { ChartCard };
export declare function Part1({ period, setPeriod, periodOptions }: {
    period: NonNullable<RoomStatsTab['period']>;
    setPeriod: NonNullable<RoomStatsTab['setPeriod']>;
    periodOptions: NonNullable<RoomStatsTab['periodOptions']>;
}): import("react").JSX.Element;
export declare function Part2({ t, perDay, series }: {
    t: NonNullable<RoomStatsTab['tr']>;
    perDay: NonNullable<RoomStatsTab['perDay']>;
    series: NonNullable<RoomStatsTab['series']>;
}): import("react").JSX.Element;
export declare function Part3({ t, perHour, series }: {
    t: NonNullable<RoomStatsTab['tr']>;
    perHour: NonNullable<RoomStatsTab['perHour']>;
    series: NonNullable<RoomStatsTab['series']>;
}): import("react").JSX.Element;
export declare function Part4({ t, rooms, series, topHours, nf1 }: {
    t: NonNullable<RoomStatsTab['tr']>;
    rooms: NonNullable<RoomStatsTab['rooms']>;
    series: NonNullable<RoomStatsTab['series']>;
    topHours: NonNullable<RoomStatsTab['topHours']>;
    nf1: NonNullable<RoomStatsTab['nf1']>;
}): import("react").JSX.Element;
