import React from 'react';
interface RichTextProps {
    /** HTML controlled value */
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: number;
    disabled?: boolean;
}
export declare function RichText({ value, onChange, placeholder, className, minHeight, disabled }: RichTextProps): React.JSX.Element;
export {};
