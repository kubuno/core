import React from 'react';
import type { MentionItem, MentionsConfig } from './types';
/** The value model a mention-aware single-line field emits. */
export interface MentionModel {
    /** The plain text typed by the user (mentions removed). */
    text: string;
    /** The mentions picked so far, in insertion order. */
    mentions: MentionItem[];
}
export interface MentionInputProps {
    mentions: MentionsConfig;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    /** Initial model (uncontrolled thereafter). */
    defaultValue?: MentionModel;
    /** Notified on every change to the {text, mentions} model. */
    onMentionsChange?: (model: MentionModel) => void;
}
/**
 * Single-line mention field: a native `<input>` whose picked mentions render as
 * removable chips BESIDE it (a `<textarea>`/`<input>` cannot hold rich chips).
 * Generalises the mail `RecipientField` pattern. The exposed value is the
 * `{ text, mentions }` model via `onMentionsChange`, not the raw input string.
 */
export declare function MentionInput({ mentions, placeholder, className, disabled, defaultValue, onMentionsChange, }: MentionInputProps): React.JSX.Element;
