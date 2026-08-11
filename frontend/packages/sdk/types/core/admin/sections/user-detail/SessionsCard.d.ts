import type { User } from '../../../types';
/**
 * Active sessions of one account, with unit and global revocation.
 *
 * Replaces the former `UserSessionsModal` of the users list: a modal could not
 * show the sessions next to the rest of the security posture, and the same list
 * had to be re-opened for every check. Same two routes, same audit trail.
 */
export default function SessionsCard({ user }: {
    user: User;
}): import("react").JSX.Element;
