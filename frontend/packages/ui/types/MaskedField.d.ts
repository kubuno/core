import React from 'react';
/**
 * One position of a mask (WinForms `MaskedTextBox` characters): `0` a digit, `9` an optional digit, `L` a letter,
 * `?` an optional letter, `A` a letter or digit, `a` an optional one, `&` / `C` any character (required / optional);
 * anything else — or a character after `\` — is a literal written by the field itself.
 */
export type MaskSlot = {
    readonly kind: 'literal';
    readonly char: string;
} | {
    readonly kind: 'input';
    readonly accepts: (c: string) => boolean;
    readonly required: boolean;
};
/** The slots of a mask. */
export declare function parseMask(mask: string): MaskSlot[];
/**
 * Formats typed text through a mask, position by position: a literal takes the next typed character when it is the
 * same one (the text already formatted), an input position takes the next character it accepts (the others are
 * dropped); literals are written as soon as the next input position is filled. Returns the formatted text and
 * whether every required position is filled.
 */
export declare function applyMask(mask: string, typed: string): {
    text: string;
    complete: boolean;
};
/** The hint shown while the field is empty: `_` for every input position, the literals as they are. */
export declare function maskPlaceholder(mask: string): string;
export interface MaskedFieldProps {
    mask?: string;
    /** The formatted text (controlled when given, followed through `onChange`). */
    value?: string;
    onChange?: (text: string) => void;
    /** Shows the field in the error colour. */
    invalid?: boolean;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    className?: string;
    style?: React.CSSProperties;
    'aria-label'?: string;
}
/**
 * A text field that takes its input through a mask (the `.kbview` `MaskedField`): `00/00/0000` for a date,
 * `+33 0 00 00 00 00` for a phone number. Characters a position does not accept are dropped, literals are written
 * for the user. The `@ui` `Input` look; `aria-invalid` with `Invalid`, or while a required position is empty after
 * the field was left.
 */
export declare const MaskedField: React.ForwardRefExoticComponent<MaskedFieldProps & React.RefAttributes<HTMLInputElement>>;
