import React from 'react';
interface NumberInputProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    label?: string;
    error?: string;
    hint?: string;
    /** Marks the label with an asterisk (project rule) and announces it to
     *  assistive technology. */
    required?: boolean;
    className?: string;
    id?: string;
}
export declare function NumberInput({ value, onChange, min, max, step, disabled, label, error, hint, required, className, id, }: NumberInputProps): React.JSX.Element;
export {};
