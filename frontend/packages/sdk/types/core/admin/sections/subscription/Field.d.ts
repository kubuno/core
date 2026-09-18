import type { ReactNode } from 'react';
/**
 * One labelled fact, stacked: the label above in the metadata size, the value
 * below in the body size.
 *
 * A local helper rather than a shared primitive: three cards on this page show
 * the same shape, and lifting it any higher would make it a component the rest
 * of the console has to be kept in step with.
 */
export default function Field({ label, children, mono, }: {
    label: string;
    children: ReactNode;
    /** Renders the value in the monospace face — for identifiers read aloud. */
    mono?: boolean;
}): import("react").JSX.Element;
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
