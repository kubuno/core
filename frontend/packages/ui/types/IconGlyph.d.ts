import React from 'react';
type IconComponent = React.ComponentType<{
    size?: number;
    color?: string;
    className?: string;
}>;
/** The discs an icon may sit on (`Icon Disc`, the message-box style of Kubuno). */
export type IconDisc = 'None' | 'Neutral' | 'Info' | 'Warning' | 'Danger' | 'Success';
export interface IconGlyphProps {
    /** The glyph (a Lucide component; the views runtime resolves `Name` to it). */
    icon?: IconComponent;
    /** Glyph size, px. */
    size?: number;
    /** A theme colour for the glyph (a CSS colour). */
    color?: string;
    disc?: IconDisc;
    className?: string;
}
/**
 * An icon (the `.kbview` `Icon`): a glyph alone, or centred on a disc twice its size (`Disc`). Decorative:
 * hidden from screen readers.
 */
export declare const IconGlyph: React.ForwardRefExoticComponent<IconGlyphProps & React.RefAttributes<HTMLSpanElement>>;
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** The icon element (the views runtime builds it from `Icon`, sized by `Glyph`). */
    icon?: React.ReactNode;
    /** Diameter, px. */
    diameter?: number;
    /** A tinted fill (`bg-surface-2`), darker on hover; otherwise only a hover tint. */
    filled?: boolean;
    /** Size of an icon given without one, px (default 18). */
    glyph?: number;
}
/** A round button showing only an icon (the `.kbview` `IconButton`). Its accessible name is required. */
export declare const IconButton: React.ForwardRefExoticComponent<IconButtonProps & React.RefAttributes<HTMLButtonElement>>;
export {};
