import { type StorageOverview } from './api';
/**
 * The default a new account receives — one instance value, plus the units that
 * decide otherwise.
 *
 * ## Only the levels somebody wrote
 *
 * The list shows the instance value and every unit that carries its own row.
 * Units that inherit are absent on purpose: listing forty units with the same
 * inherited figure would bury the three that were actually decided, and
 * "inherits" is the default state of everything anyway.
 *
 * ## Reverting is a delete, not a copy
 *
 * "Back to inherited" removes the unit's row rather than writing the parent's
 * value into it. That is what makes the unit keep following its parent
 * afterwards — a copied value would silently freeze the day the parent moved.
 *
 * ## It applies to NEW accounts
 *
 * A quota is stored on the account, so raising the default does not raise
 * anybody's existing ceiling. The card says so rather than letting an operator
 * assume a retroactive policy and discover otherwise from a support ticket.
 */
export default function QuotaPolicyCard({ overview }: {
    overview: StorageOverview;
}): import("react").JSX.Element;
