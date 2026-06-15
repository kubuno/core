import React from 'react';
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
}
export declare function Textarea({ label, error, hint, className, id, ...props }: TextareaProps): React.JSX.Element;
export {};
