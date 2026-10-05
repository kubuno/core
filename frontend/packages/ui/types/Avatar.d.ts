import React from 'react';
/** Initials of a display name: the first letter of its first two words (« Camille Martin » → « CM »). */
export declare function initialsOf(name: string): string;
export interface AvatarProps {
    /** The person's name: its initials show without a photo, and the photo's alternative text. */
    displayName?: string;
    /** Letters shown instead of the name's initials. */
    initials?: string;
    /** The photo's address; absent or failing → the initials. */
    image?: string | null;
    /** `auto`: a neutral disc, initials in the secondary text colour. `accent`: the accent, white initials. */
    tint?: 'auto' | 'accent';
    shape?: 'circle' | 'rounded';
    /** Diameter in px. */
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}
/**
 * A person's picture, or their initials on a disc while there is none (the `.kbview` `Avatar`). Built on
 * Radix Avatar: the initials show until the photo has loaded, and stay when it fails.
 */
export declare const Avatar: React.ForwardRefExoticComponent<AvatarProps & React.RefAttributes<HTMLSpanElement>>;
