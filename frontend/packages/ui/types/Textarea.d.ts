import React from 'react';
import type { MentionsConfig } from './mention/types';
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
    /**
     * Opt-in @mention support. ABSENT (or `enabled` falsy) → a plain native
     * `<textarea>`, 100 % unchanged.
     *
     * When enabled the field cannot stay a native `<textarea>` (it cannot hold
     * chip elements): it switches INTERNALLY to a multi-line contenteditable that
     * looks identical. ⚠️ SEMANTIC SHIFT — the value is then HTML, not plain text:
     * seed it via `value` (HTML) and read it back via `onMentionsChange(html)`.
     * The native `onChange` is not called in this mode.
     */
    mentions?: MentionsConfig;
    /** Called with the HTML value when `mentions` is enabled. */
    onMentionsChange?: (html: string) => void;
}
export declare function Textarea({ label, error, hint, className, id, mentions, onMentionsChange, ...props }: TextareaProps): React.JSX.Element;
export {};
