import React from 'react';
interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
    label?: string;
    description?: string;
    size?: 'sm' | 'md';
}
export declare function Toggle({ label, description, size, className, id, ...props }: ToggleProps): React.JSX.Element;
export {};
