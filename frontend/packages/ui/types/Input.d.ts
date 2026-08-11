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
    mentions?: MentionsConfig;
    /** Called with the `{ text, mentions }` model when `mentions` is enabled. */
    onMentionsChange?: (model: MentionModel) => void;
    /** Initial `{ text, mentions }` model when `mentions` is enabled. */
    defaultMentionValue?: MentionModel;
}
export declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
