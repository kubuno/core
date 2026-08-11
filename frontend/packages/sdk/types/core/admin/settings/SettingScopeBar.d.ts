import { type ActiveScope } from './scopeTypes';
/**
 * The scope selector that heads every settings page.
 *
 * It sits ABOVE the list rather than inside it because the scope qualifies
 * every control below: an administrator who cannot see, at a glance, whether
 * they are editing the whole instance or one branch will eventually edit the
 * wrong one. The breadcrumb spells out the path from the root so "Marketing" is
 * never ambiguous between two units of the same name.
 */
export default function SettingScopeBar({ scope, onChange, sticky, }: {
    scope: ActiveScope;
    onChange: (next: ActiveScope) => void;
    /**
     * False when the bar heads a settings BLOCK inside a page that is about
     * something else: pinning it to the viewport there would park it over the
     * inventory the operator is scrolling through, far from what it qualifies.
     */
    sticky?: boolean;
}): import("react").JSX.Element;
