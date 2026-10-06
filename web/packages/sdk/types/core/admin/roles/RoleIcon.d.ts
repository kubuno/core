/**
 * Code-behind of `RoleIcon.kbview` (converted from `RoleIcon.tsx` by @kubuno/views-migrate).
 */
import { type Role } from "../../authz/types";
import { ViewBase } from './RoleIcon.kbview';
export type RoleIconProps = {
    role: Role;
    size?: number;
};
export declare class RoleIcon extends ViewBase {
    get size(): number;
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_main(): boolean;
}
declare const _default: import("react").FunctionComponent<Readonly<RoleIconProps>>;
export default _default;
