/**
 * The parts of `HomeSection.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import type { HomeSection } from './HomeSection';
declare function HomeCard({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export { HomeCard };
declare function CardHeader({ Icon, title, manageTab }: {
    Icon: LucideIcon;
    title: string;
    manageTab?: string;
}): import("react").JSX.Element;
export { CardHeader };
declare function CardLink({ to, icon, children }: {
    to: string;
    icon?: ReactNode;
    children: ReactNode;
}): import("react").JSX.Element;
export { CardLink };
export declare function Part1({ t, hasStats, num, stats, sees }: {
    t: NonNullable<HomeSection['tr']>;
    hasStats: NonNullable<HomeSection['hasStats']>;
    num: HomeSection['num'];
    stats: HomeSection['stats'];
    sees: HomeSection['sees'];
}): import("react").JSX.Element;
export declare function Part2({ t, hasStats, num, stats, sees }: {
    t: NonNullable<HomeSection['tr']>;
    hasStats: NonNullable<HomeSection['hasStats']>;
    num: HomeSection['num'];
    stats: HomeSection['stats'];
    sees: HomeSection['sees'];
}): import("react").JSX.Element;
export declare function Part3({ t, storageUsed, storageQuota, storagePct }: {
    t: NonNullable<HomeSection['tr']>;
    storageUsed: NonNullable<HomeSection['storageUsed']>;
    storageQuota: NonNullable<HomeSection['storageQuota']>;
    storagePct: NonNullable<HomeSection['storagePct']>;
}): import("react").JSX.Element;
export declare function Part4({ t }: {
    t: NonNullable<HomeSection['tr']>;
}): import("react").JSX.Element;
export declare function Part5({ t }: {
    t: NonNullable<HomeSection['tr']>;
}): import("react").JSX.Element;
export declare function Part6({ t }: {
    t: NonNullable<HomeSection['tr']>;
}): import("react").JSX.Element;
export declare function Part7({ t }: {
    t: NonNullable<HomeSection['tr']>;
}): import("react").JSX.Element;
