import React from 'react';
type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
type BadgeSize = 'sm' | 'md';
interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    size?: BadgeSize;
    className?: string;
    dot?: boolean;
    /** Largest width in pixels before the text is cut with an ellipsis (`MaxWidth`); 0 or unset = no limit. */
    maxWidth?: number;
}
export declare function Badge({ children, variant, size, className, dot, maxWidth }: BadgeProps): React.JSX.Element;
export {};
