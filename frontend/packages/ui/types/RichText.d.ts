import React from 'react';
import type { MentionsConfig } from './mention/types';
interface RichTextProps {
    /** HTML controlled value */
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: number;
    disabled?: boolean;
    /**
     * Opt-in @mention support. ABSENT (or `enabled` falsy) → unchanged behaviour.
     * When enabled, picking a mention inserts an inline chip directly in the
     * contenteditable; the chips are part of the emitted HTML `value`.
     */
    mentions?: MentionsConfig;
}
export declare function RichText({ value, onChange, placeholder, className, minHeight, disabled, mentions }: RichTextProps): React.JSX.Element;
export {};
