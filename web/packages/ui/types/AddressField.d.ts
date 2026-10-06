import { type ReactNode } from 'react';
export interface AddressValue {
    street: string;
    postal: string;
    city: string;
    /** ISO-3166 alpha-2, e.g. "FR", or "" when unset. */
    country: string;
    poBox?: string;
    complement?: string;
    region?: string;
    label?: string;
}
export interface AddressFieldProps {
    value: AddressValue;
    onChange: (v: AddressValue) => void;
    primaryColor: string;
    /** Leading icon; defaults to a map pin. Pass `null` to omit it when the
     * consumer already has its own icon gutter. */
    icon?: ReactNode;
    withLabel?: boolean;
    labelPresets?: string[];
    large?: boolean;
}
export declare function AddressField({ value, onChange, primaryColor, icon, withLabel, labelPresets, large }: AddressFieldProps): import("react").JSX.Element;
