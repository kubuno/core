import { type ReactNode } from 'react';
export interface OutlinedFieldProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    /** Leading icon, rendered OUTSIDE the box on its left (optional). */
    icon?: ReactNode;
    /** HTML input type (text/email/url/tel/number). */
    type?: string;
    /** Shown only while floated (focused), like Material — the label IS the resting hint. */
    placeholder?: string;
    primaryColor: string;
    /** Adds a red asterisk to the floating label (compact mode, where the title lives in the field). */
    required?: boolean;
    autoFocus?: boolean;
    /** Multi-line variant (paragraph answers). */
    multiline?: boolean;
    /** Bigger type for the one-question-per-screen layout. */
    large?: boolean;
    inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url';
    /** Read-only display (used when the field acts as a select trigger). */
    readOnly?: boolean;
    /** Trailing affordance inside the box, right-aligned (e.g. a chevron). */
    trailing?: ReactNode;
}
export declare function OutlinedField({ label, value, onChange, icon, type, placeholder, primaryColor, required, autoFocus, multiline, large, inputMode, readOnly, trailing, }: OutlinedFieldProps): import("react").JSX.Element;
