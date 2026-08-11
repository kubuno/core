import type { User } from '../../../../types';
/**
 * Three stamps the server writes and nobody edits — hence an ordinary `Card`
 * and no pencil. A card that offered one would be promising something
 * `PATCH /admin/users/:id` cannot do.
 */
export default function LifecycleCard({ user }: {
    user: User;
}): import("react").JSX.Element;
