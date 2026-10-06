import { Component, type ErrorInfo, type ReactNode } from 'react';
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
