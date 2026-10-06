import { type HealthCheck } from "./types";
import type { GettingStartedCard } from './GettingStartedCard';
declare function TaskRow({ check }: {
    check: HealthCheck;
}): import("react").JSX.Element;
export { TaskRow };
export declare function Part1({ t, tasks }: {
    t: NonNullable<GettingStartedCard['tr']>;
    tasks: NonNullable<GettingStartedCard['tasks']>;
}): import("react").JSX.Element;
export declare function Part2({ settled, scoreable, t }: {
    settled: NonNullable<GettingStartedCard['settled']>;
    scoreable: NonNullable<GettingStartedCard['scoreable']>;
    t: NonNullable<GettingStartedCard['tr']>;
}): import("react").JSX.Element;
