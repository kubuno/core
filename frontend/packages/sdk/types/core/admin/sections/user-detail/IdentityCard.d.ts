import type { User } from '../../../types';
interface Props {
    user: User;
    /** Sticky on a wide screen; stacked above the tabs on a narrow one. */
    mobile: boolean;
    busy: boolean;
    onToggleActive: () => void;
    /** Opens one of the sheet's tabs — the actions that already have a card there
     *  send the operator to it rather than growing a second way to do the job. */
    goPane: (pane: 'profile' | 'security') => void;
}
/**
 * The account's identity card — context on the left, verbs underneath.
 *
 * It stays put while the tabs scroll: the tabs show and edit PROPERTIES, this
 * card answers "who am I acting on?" and carries the actions that have side
 * effects on the account itself. Keeping the two apart is what stops an operator
 * from editing one account while reading another's name.
 */
export declare function IdentityCard({ user, mobile, busy, onToggleActive, goPane }: Props): import("react").JSX.Element;
export {};
