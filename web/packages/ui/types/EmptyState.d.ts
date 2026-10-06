import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
/**
 * The FOUR situations an empty area can be in. They look similar and are
 * routinely conflated, yet they call for different words and — above all —
 * different actions. Picking the wrong one actively misleads:
 *
 *  • `first-use`   — the collection is genuinely empty and nothing is filtered.
 *                    This is the only variant that invites CREATION: the primary
 *                    action is "New user", "Add a domain"…  Tone: welcoming.
 *
 *  • `no-results`  — rows exist, but the active search/filters match none of
 *                    them. The way out is to WIDEN the query, so the action is
 *                    "Clear the filters" / "Reset the search".  NEVER offer a
 *                    create button here: the user is looking for something that
 *                    probably exists, and creating a duplicate is the one thing
 *                    they must not be nudged into. The component enforces this
 *                    by rendering the action as `secondary`, and warns in dev if
 *                    it is handed a `primary` one.
 *
 *  • `error`       — the data could not be loaded. Nothing is known about the
 *                    collection, so claiming "no user" would be a lie. The
 *                    action is "Retry"; the description says what failed.
 *
 *  • `unavailable` — the feature exists but is out of reach here: module not
 *                    installed, insufficient rights, plan restriction. There is
 *                    usually no action at all — only `docHref`, pointing at what
 *                    would unlock it.
 */
export type EmptyStateVariant = 'first-use' | 'no-results' | 'error' | 'unavailable';
export interface EmptyStateAction {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    /** Overrides the button style implied by the variant. */
    variant?: 'primary' | 'secondary' | 'ghost';
    disabled?: boolean;
}
export interface EmptyStateProps {
    /** Illustrative glyph — an already-sized lucide element, e.g. `<Users size={26} />`. */
    icon: ReactNode;
    title: string;
    description?: ReactNode;
    /** Main way out. Its meaning is dictated by `variant` (see above). */
    action?: EmptyStateAction;
    secondaryAction?: EmptyStateAction;
    /** "Learn more" link — documentation, not an action. */
    docHref?: string;
    docLabel?: string;
    variant?: EmptyStateVariant;
    /** Half the vertical breathing room — for an empty state inside a small card. */
    compact?: boolean;
    className?: string;
    t?: TFunction;
}
export declare function EmptyState({ icon, title, description, action, secondaryAction, docHref, docLabel, variant, compact, className, t, }: EmptyStateProps): import("react").JSX.Element;
