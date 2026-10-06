import React from 'react';
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'text' | 'textDanger';
type ButtonSize = 'sm' | 'md' | 'lg';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Leading icon — rendered before children */
    icon?: React.ReactNode;
    loading?: boolean;
    children?: React.ReactNode;
}
export declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
export {};
