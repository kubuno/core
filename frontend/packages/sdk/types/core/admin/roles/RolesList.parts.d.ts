import { type Role } from "../../authz/types";
import type { RolesList } from './RolesList';
declare function TypeBadge({ role }: {
    role: Role;
}): import("react").JSX.Element;
export { TypeBadge };
export declare function Part1({ rows, loading, error, onRetry, q, setQ, t, isSuperuser, setCreating, roleName, roleDescription, canGrant, setAssign, openRole, askDelete }: {
    rows: NonNullable<RolesList['rows']>;
    loading: NonNullable<RolesList['props']['loading']>;
    error: RolesList['props']['error'];
    onRetry: RolesList['props']['onRetry'];
    q: NonNullable<RolesList['q']>;
    setQ: NonNullable<RolesList['setQ']>;
    t: NonNullable<RolesList['tr']>;
    isSuperuser: NonNullable<RolesList['isSuperuser']>;
    setCreating: NonNullable<RolesList['setCreating']>;
    roleName: NonNullable<RolesList['roleName']>;
    roleDescription: NonNullable<RolesList['roleDescription']>;
    canGrant: NonNullable<RolesList['canGrant']>;
    setAssign: NonNullable<RolesList['setAssign']>;
    openRole: RolesList['openRole'];
    askDelete: RolesList['askDelete'];
}): import("react").JSX.Element;
