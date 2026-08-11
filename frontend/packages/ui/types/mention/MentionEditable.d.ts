import type { CSSProperties } from 'react';
import type { MentionsConfig } from './types';
export interface MentionEditableProps {
    /** Controlled HTML value (initialised once — see the note on semantics). */
    value: string;
    onChange: (html: string) => void;
    mentions: MentionsConfig;
    placeholder?: string;
    className?: string;
    style?: CSSProperties;
    disabled?: boolean;
    id?: string;
}
/**
 * A multi-line contenteditable that behaves like a textarea but can hold mention
 * chips (a native `<textarea>` cannot contain elements). Used by `Textarea` when
 * `mentions` is enabled. The emitted value is HTML (the chips are `<span>`s in
 * it) — a deliberate semantic shift from the plain-text value of a native
 * textarea, documented on the primitive.
 *
 * The value is applied to the DOM only once on mount (like `RichText`) so that
 * re-emitting HTML on each keystroke never resets the caret.
 */
export declare function MentionEditable({ value, onChange, mentions, placeholder, className, style, disabled, id, }: MentionEditableProps): import("react").JSX.Element;
