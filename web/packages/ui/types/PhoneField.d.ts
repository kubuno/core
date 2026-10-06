import { type ReactNode } from 'react';
export interface PhoneValue {
    /** ISO-3166 alpha-2, e.g. "FR". */
    country: string;
    /** Local number as typed (no dial code). */
    number: string;
    /** Free-text label / type (Domicile, Professionnel, a custom one…). */
    label?: string;
}
export interface PhoneFieldProps {
    value: PhoneValue;
    onChange: (v: PhoneValue) => void;
    primaryColor: string;
    /** Leading icon; defaults to a handset. Pass `null` to omit it — e.g. when the
     * consumer already provides its own icon gutter (a contact editor), otherwise
     * two icons stack. */
    icon?: ReactNode;
    /** Show the editable "Libellé" combobox (contacts use it; a plain form may not). */
    withLabel?: boolean;
    /** Suggestions offered in the Libellé dropdown (free text stays allowed). */
    labelPresets?: string[];
    large?: boolean;
}
export declare function PhoneField({ value, onChange, primaryColor, icon, withLabel, labelPresets, large }: PhoneFieldProps): import("react").JSX.Element;
