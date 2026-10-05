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
/** `FontWeight` (web): the host's weight steps. The host renders `font-medium` at 600 and running text at 500. */
export type TextWeight = 'Regular' | 'Medium' | 'SemiBold' | 'Bold';
export declare const TEXT_WEIGHT_CLASS: Readonly<Record<TextWeight, string>>;
/** `FontStyle` (web): upright or italic. */
export type TextStyle = 'Normal' | 'Italic';
export interface LabelProps extends Omit<React.HTMLAttributes<HTMLParagraphElement>, 'role'> {
    text?: React.ReactNode;
    role?: TextRole;
    textAlign?: TextAlign;
    overflow?: TextOverflow;
    /** Text weight; unset = the running text's (500). */
    weight?: TextWeight;
    fontStyle?: TextStyle;
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
    weight?: TextWeight;
    fontStyle?: TextStyle;
}
/**
 * A link (the `.kbview` `LinkLabel`). With an `href`, a plain left click stays in the app — its `onClick`
 * decides where to go (SPA routing) — while a middle or modified click opens the address as any link does.
 */
export declare const LinkLabel: React.ForwardRefExoticComponent<LinkLabelProps & React.RefAttributes<HTMLAnchorElement>>;
