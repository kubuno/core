/**
 * Code-behind of `StatusBadge.kbview` (converted from `StatusBadge.tsx` by @kubuno/views-migrate).
 */
import { ViewBase } from './StatusBadge.kbview';
export type StatusBadgeProps = {
    active: boolean;
    label: string;
};
export declare class StatusBadge extends ViewBase {
    get variant(): "default" | "success";
}
declare const _default: import("react").FunctionComponent<Readonly<StatusBadgeProps>>;
export default _default;
