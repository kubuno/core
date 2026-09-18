import { type ReactNode } from 'react';
export interface GroupField {
    key: string;
    label: string;
    /** Hidden until the group is expanded (Plus). */
    advanced?: boolean;
}
export interface FieldGroupProps {
    icon: ReactNode;
    fields: GroupField[];
    value: Record<string, string>;
    onChange: (v: Record<string, string>) => void;
    primaryColor: string;
    large?: boolean;
}
export declare function FieldGroup({ icon, fields, value, onChange, primaryColor, large }: FieldGroupProps): import("react").JSX.Element;
