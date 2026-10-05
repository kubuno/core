import React from 'react';
import type { MentionsConfig } from './mention/types';
import { type MentionModel } from './mention/MentionInput';
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    /**
     * Opt-in @mention support. ABSENT (or `enabled` falsy) → a plain native
     * `<input>`, 100 % unchanged. When enabled the field becomes a chips-field:
     * picked mentions render as removable chips beside the input and the value is
     * exposed via `onMentionsChange` as a `{ text, mentions }` model (the native
     * `value`/`onChange` no longer describe the full field).
     */
    /**
     * No chrome: no frame, no background, the focus stroke under the text.
     *
     * For a TITLE line — of a document, of an event — which is not a form field
     * and must not look like one. The variant lives here rather than as a bare
     * `<input>` copied into every screen: that is the only way it stays the same
     * everywhere, and the only way the rule "always the primitive" avoids an
     * exception that would end up being extended.
     */
    bare?: boolean;
    mentions?: MentionsConfig;
    /** Called with the `{ text, mentions }` model when `mentions` is enabled. */
    onMentionsChange?: (model: MentionModel) => void;
    /** Initial `{ text, mentions }` model when `mentions` is enabled. */
    defaultMentionValue?: MentionModel;
}
export declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
