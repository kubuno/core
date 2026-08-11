import type { User } from '../../../types';
/**
 * Security tab — the posture of the account and the levers over it.
 *
 * Order is deliberate, strongest signal first: what protects the account (2FA),
 * what is pending on its credentials (forced password change, and the reset
 * slot below), then what is currently open in its name (sessions).
 */
export default function SecurityTab({ user }: {
    user: User;
}): import("react").JSX.Element;
