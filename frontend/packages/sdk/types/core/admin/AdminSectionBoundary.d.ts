import { Component, type ErrorInfo, type ReactNode } from 'react';
/**
 * "You may not open this section" — the explicit state a refusal must produce.
 *
 * Reached two ways: the tab was filtered out of the navigation and someone typed
 * its URL anyway, or the section itself hit a refusal deeper in. Either way the
 * answer is a sentence, never a blank page.
 */
export declare function AdminForbidden({ titleKey }: {
    titleKey?: string;
}): import("react").JSX.Element;
/**
 * "That address names no section" — what `/admin/nawak` produces.
 *
 * Since the section lives in the PATH, a typo (or a link to a section this build
 * no longer has) is a reachable URL that resolves to nothing. Redirecting to the
 * landing would silently pretend the address was right; a blank page would say
 * nothing at all. This says what happened and offers the way back.
 */
export declare function AdminSectionNotFound({ tab }: {
    tab: string;
}): import("react").JSX.Element;
/**
 * Keeps one section's failure inside that section.
 *
 * A delegated administrator sees the console but not every surface, and a panel
 * that assumes its data arrived can throw on a refused request. Without this the
 * whole `/admin` route unmounts and the operator gets a white page with no clue
 * what happened — the one outcome a permission refusal must never produce.
 * Re-keyed on the tab id, so navigating away from a broken section recovers.
 */
export default class AdminSectionBoundary extends Component<{
    children: ReactNode;
}, {
    failed: boolean;
}> {
    state: {
        failed: boolean;
    };
    static getDerivedStateFromError(): {
        failed: boolean;
    };
    componentDidCatch(error: Error, info: ErrorInfo): void;
    render(): string | number | bigint | boolean | Iterable<ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | import("react").JSX.Element | null | undefined;
}
