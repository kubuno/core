import type { User } from "../../types";
import type { AssignRoleDialog } from './AssignRoleDialog';
declare function Avatar({ user, size }: {
    user: User;
    size?: number;
}): import("react").JSX.Element;
export { Avatar };
export declare function Part1({ groupId, setGroupId, groups, t }: {
    groupId: AssignRoleDialog['groupId'];
    setGroupId: NonNullable<AssignRoleDialog['setGroupId']>;
    groups: AssignRoleDialog['groups'];
    t: NonNullable<AssignRoleDialog['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ t, role, blockers }: {
    t: NonNullable<AssignRoleDialog['tr']>;
    role: NonNullable<AssignRoleDialog['props']['role']>;
    blockers: NonNullable<AssignRoleDialog['blockers']>;
}): import("react").JSX.Element;
export declare function Part3({ expiresAt, setExpiresAt, t }: {
    expiresAt: AssignRoleDialog['expiresAt'];
    setExpiresAt: NonNullable<AssignRoleDialog['setExpiresAt']>;
    t: NonNullable<AssignRoleDialog['tr']>;
}): import("react").JSX.Element;
