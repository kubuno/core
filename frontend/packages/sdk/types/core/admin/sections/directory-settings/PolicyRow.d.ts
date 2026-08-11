import type { ResolvedSetting } from '../../settings/scopeTypes';
import type { DirectoryPolicy } from './useDirectoryPolicy';
/**
 * One governed key: its control, then the sentence that says where the value
 * comes from.
 *
 * The provenance line is not optional decoration on this page. A directory
 * policy is the kind of thing an operator sets on one branch and then finds
 * inexplicably applied everywhere; `ProvenanceLine` is what states "inherited
 * from X" / "overridden here" / "locked by X", and it carries the revert, the
 * lock and the inheritance-chain window. Reusing the component rather than
 * restating it here is what keeps this page's affordances identical to every
 * other settings screen.
 */
/** Every control writes on the click — none of these values is free text. */
interface RowProps {
    setting: ResolvedSetting | undefined;
    policy: DirectoryPolicy;
    readOnly: boolean;
    onShowChain: (key: string) => void;
}
/** A boolean shown as a switch — "is this capability on for this scope". */
export declare function ToggleRow({ setting, policy, readOnly, onShowChain }: RowProps): import("react").JSX.Element | null;
/**
 * A boolean shown as a checkbox — "may a person change this about themselves".
 *
 * A checkbox rather than a switch because these read as a *list of permissions*
 * granted together, which is how the card is scanned: several boxes under one
 * question, not several independent capabilities.
 */
export declare function CheckboxRow({ setting, policy, readOnly, onShowChain, personal }: RowProps & {
    /** Marks a field carrying personal data (`gender`, `birthday`). */
    personal?: boolean;
}): import("react").JSX.Element | null;
/**
 * A profile field the comparable console governs and this instance does not
 * store yet.
 *
 * Rendered as a disabled checkbox rather than omitted, so the page can be read
 * side by side with the console it is modelled on and the answer to "and the
 * other eight?" is on the screen. It carries no provenance line and writes
 * nothing: there is no setting behind it, and there must not be one until a
 * column and a reader exist — a switch over a column that does not exist is the
 * exact defect the rest of this page was built to avoid.
 */
export declare function UnstoredFieldRow({ field }: {
    field: string;
}): import("react").JSX.Element;
/**
 * The closed value set of `directory.audience`, as mutually exclusive options.
 *
 * Radio buttons, not a dropdown: there are two of them, they are the substance
 * of the card, and the consequence of each needs a sentence next to it. The
 * card's own title is the group's label — which is why no `<label>` is written
 * by hand for the set.
 */
export declare function AudienceRow({ setting, policy, readOnly, onShowChain }: RowProps): import("react").JSX.Element | null;
export {};
