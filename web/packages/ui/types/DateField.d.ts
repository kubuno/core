import { type ReactNode } from 'react';
export interface DateValue {
    day: string;
    /** Month as "1".."12", or "" when unset. */
    month: string;
    /** Optional year. */
    year: string;
    label?: string;
}
export interface DateFieldProps {
    value: DateValue;
    onChange: (v: DateValue) => void;
    primaryColor: string;
    /** Leading icon; defaults to a calendar (pass a cake for a birthday). Pass
     * `null` to omit it when the consumer already has its own icon gutter. */
    icon?: ReactNode;
    withLabel?: boolean;
    labelPresets?: string[];
    large?: boolean;
    /** Accepted year range. A birthday passes maxYear = current year. */
    minYear?: number;
    maxYear?: number;
}
export declare function DateField({ value, onChange, primaryColor, icon, withLabel, labelPresets, large, minYear, maxYear }: DateFieldProps): import("react").JSX.Element;
