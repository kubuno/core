import React from 'react';
/**
 * The typographic roles shared with the desktop (`Label Role`, VIEWS-SPEC §7.1), as the host's text
 * steps: `Meta` and `Body` are Tailwind's `text-xs` / `text-sm` (re-pointed at 11.5 / 13.5 px by
 * `index.css`, with Tailwind's line heights), the others the `--kb-text-*` tokens.
 */
export type TextRole = 'Micro' | 'Meta' | 'Body' | 'Heading' | 'Title';
export declare const TEXT_ROLE_CLASS: Readonly<Record<TextRole, string>>;
/** `TextAlign` (WinForms `ContentAlignment`) → the horizontal part, the only one a flow label has. */
export type TextAlign = 'TopLeft' | 'TopCenter' | 'TopRight' | 'MiddleLeft' | 'MiddleCenter' | 'MiddleRight' | 'BottomLeft' | 'BottomCenter' | 'BottomRight';
/** `Overflow`: what a text too long for its box does. */
export type TextOverflow = 'Ellipsis' | 'Clip' | 'Wrap';
export interface LabelProps extends Omit<React.HTMLAttributes<HTMLParagraphElement>, 'role'> {
    text?: React.ReactNode;
    role?: TextRole;
    textAlign?: TextAlign;
    overflow?: TextOverflow;
    /** The ARIA role of the paragraph (rarely needed). */
    ariaRole?: string;
}
/**
 * A line or paragraph of text in one of the shared typographic roles (the `.kbview` `Label`). Colours come
 * from theme tokens (`ForeColor`), sizes from the role.
 */
export declare const Label: React.ForwardRefExoticComponent<LabelProps & React.RefAttributes<HTMLParagraphElement>>;
export interface LinkLabelProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    text?: React.ReactNode;
    role?: TextRole;
}
/**
 * A link (the `.kbview` `LinkLabel`). With an `href`, a plain left click stays in the app — its `onClick`
 * decides where to go (SPA routing) — while a middle or modified click opens the address as any link does.
 */
export declare const LinkLabel: React.ForwardRefExoticComponent<LinkLabelProps & React.RefAttributes<HTMLAnchorElement>>;
