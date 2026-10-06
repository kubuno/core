import React from 'react';
export interface EditableProps {
    /** Initial text, seeded once so the caret never jumps (the box is uncontrolled). */
    defaultValue?: string;
    placeholder?: string;
    disabled?: boolean;
    /** Spell-check the content. Off by default (this is usually preview/sample text). */
    spellCheck?: boolean;
    /** Emits the plain text on every edit. */
    onTextChange?: (text: string) => void;
    className?: string;
    style?: React.CSSProperties;
    'aria-label'?: string;
}
/**
 * Editable — primitive `div[contenteditable]` text box. Shares the exact border
 * and focus ring of the `<Input>` primitive. Uncontrolled: seed via `defaultValue`
 * (so the caret is stable across renders) and read edits through `onTextChange`.
 * For formatted/rich text with a toolbar use `<RichText>` instead.
 *
 * The placeholder is rendered via the CSS `:empty::before` trick, so it respects
 * whatever padding the caller sets (unlike an absolutely-positioned overlay).
 */
export declare const Editable: React.ForwardRefExoticComponent<EditableProps & React.RefAttributes<HTMLDivElement>>;
