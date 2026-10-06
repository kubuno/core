import { type HealthCheck } from "./types";
import type { HealthSection } from './HealthSection';
declare function CheckRow({ check, canManage }: {
    check: HealthCheck;
    canManage: boolean;
}): import("react").JSX.Element;
export { CheckRow };
export declare function Part1({ items, open, defaultOpen, setOpen }: {
    items: NonNullable<HealthSection['items']>;
    open: HealthSection['open'];
    defaultOpen: NonNullable<HealthSection['defaultOpen']>;
    setOpen: NonNullable<HealthSection['setOpen']>;
}): import("react").JSX.Element;
