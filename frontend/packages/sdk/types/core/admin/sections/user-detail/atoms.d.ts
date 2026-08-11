import type { User } from '../../../types';
export declare function RoleBadge({ role, label }: {
    role: string;
    label: string;
}): import("react").JSX.Element;
export declare function StatusBadge({ active, label }: {
    active: boolean;
    label: string;
}): import("react").JSX.Element;
/**
 * The definition row and the em-dash placeholder are shared with the other
 * record sheets — three of them draw the same row now, so it lives one level up
 * (`inline-edit/Field`) and is re-exported here for the tabs that already
 * import it from this file.
 */
export { Field, orDash } from '../../inline-edit/Field';
/** Circular monogram — the account has no avatar in the vast majority of cases. */
export declare function UserAvatar({ user, size }: {
    user: User;
    size?: number;
}): import("react").JSX.Element;
