import { type MyExportRun } from "./api";
import type { RequestStatus } from './RequestStatus';
declare function StatusBadge({ run }: {
    run: MyExportRun;
}): import("react").JSX.Element;
export { StatusBadge };
export declare function Part1({ t, latest, locale }: {
    t: NonNullable<RequestStatus['tr']>;
    latest: NonNullable<RequestStatus['latest']>;
    locale: NonNullable<RequestStatus['props']['locale']>;
}): import("react").JSX.Element;
export declare function Part2({ t }: {
    t: NonNullable<RequestStatus['tr']>;
}): import("react").JSX.Element;
