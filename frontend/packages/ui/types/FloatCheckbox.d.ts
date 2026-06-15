interface FloatCheckboxProps {
    selected: boolean;
    onToggle: () => void;
    className?: string;
}
/**
 * Circular floating checkbox used for multi-select over media cards (files, photos…).
 * Invisible by default; appears on parent hover and stays visible when selected.
 * Wrap the parent container with `group` to enable the hover reveal.
 */
export declare function FloatCheckbox({ selected, onToggle, className }: FloatCheckboxProps): import("react").JSX.Element;
export {};
