import React from 'react';
type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
type BadgeSize = 'sm' | 'md';
interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    size?: BadgeSize;
    className?: string;
    dot?: boolean;
}
export declare function Badge({ children, variant, size, className, dot }: BadgeProps): React.JSX.Element;
export {};
