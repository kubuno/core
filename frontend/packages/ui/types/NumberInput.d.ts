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
    className?: string;
    id?: string;
}
export declare function NumberInput({ value, onChange, min, max, step, disabled, label, error, hint, className, id, }: NumberInputProps): React.JSX.Element;
export {};
