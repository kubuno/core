/**
 * Code-behind of `RoleBadge.kbview` (converted from `RoleBadge.tsx` by @kubuno/views-migrate).
 */
import { ViewBase } from './RoleBadge.kbview';
export type RoleBadgeProps = {
    role: string;
    label: string;
};
export declare class RoleBadge extends ViewBase {
    get variant(): "primary" | "danger" | "default";
}
declare const _default: import("react").FunctionComponent<Readonly<RoleBadgeProps>>;
export default _default;
