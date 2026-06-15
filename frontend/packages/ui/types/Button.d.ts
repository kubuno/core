import React from 'react';
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Leading icon — rendered before children */
    icon?: React.ReactNode;
    loading?: boolean;
    children?: React.ReactNode;
}
export declare function Button({ variant, size, icon, loading, className, disabled, children, type, ...props }: ButtonProps): React.JSX.Element;
export {};
