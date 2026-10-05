export interface LabelOption {
    id: string;
    name: string;
    /** Any CSS colour. The chip is filled with it and its text is white. */
    color: string;
}
export interface LabelFieldProps {
    /** Every label the person may choose from. */
    options: LabelOption[];
    /** Ids currently chosen. */
    value: string[];
    onChange: (ids: string[]) => void;
    disabled?: boolean;
    /** Shown on the button that opens the list. */
    placeholder?: string;
    /** Shown in place of the list when there is nothing to choose from. */
    emptyHint?: string;
    /** Search box label, for the list. */
    searchPlaceholder?: string;
}
export declare function LabelField({ options, value, onChange, disabled, placeholder, emptyHint, searchPlaceholder, }: LabelFieldProps): import("react").JSX.Element;
