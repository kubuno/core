import { type ActiveScope } from './scopeTypes';
/**
 * The one line at the top of the settings column that names what is being
 * edited.
 *
 * The tree beside it already shows the selection, but a tree shows it as a
 * highlighted row twelve rows down a scrollable panel — and the operator's eye
 * is on the form, not on the panel. Every value below this line belongs to the
 * scope it names, and it says which level the unfilled ones follow, because
 * "inherited" means nothing until it says inherited FROM WHAT.
 *
 * It shares `admin-org-units` with the panel: same key, same cache, no second
 * request.
 */
export declare function ScopeHeadline({ scope }: {
    scope: ActiveScope;
}): import("react").JSX.Element;
export interface ScopeTreeProps {
    scope: ActiveScope;
    onChange: (next: ActiveScope) => void;
    /** Units holding their own value for at least one setting of this page —
     *  marked with a dot, so a branch that diverges is findable without opening
     *  it. Empty is the normal case and shows nothing. */
    overriding?: Set<string>;
}
export default function ScopeTree({ scope, onChange, overriding }: ScopeTreeProps): import("react").JSX.Element;
