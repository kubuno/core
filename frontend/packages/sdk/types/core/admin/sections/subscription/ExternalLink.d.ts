import type { ReactNode } from "react";
/**
 * An outgoing link, styled once for the whole page.
 *
 * `rel="noreferrer"` on every one of them: these point at public pages, and the
 * address of a private instance is not something a click should hand to them.
 */
export declare function ExternalLink({ href, children }: {
    href: string;
    children: ReactNode;
}): import("react").JSX.Element;
