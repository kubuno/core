import React from 'react';
export interface SearchFieldProps {
    /** The searched text (controlled when given, followed through `onChange`). */
    value?: string;
    onChange?: (text: string) => void;
    /** Enter: the search is asked for now (the text). */
    onSearch?: (text: string) => void;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    maxLength?: number;
    className?: string;
    style?: React.CSSProperties;
    'aria-label'?: string;
}
/**
 * A search box (the `.kbview` `SearchField`): the shell search bar's pill (`--color-search-bg`, white and raised
 * while focused) with its magnifier and a clear button. Escape clears the text, Enter asks for the search
 * (`onSearch`). A native `type="search"` input with `role="searchbox"`.
 */
export declare const SearchField: React.ForwardRefExoticComponent<SearchFieldProps & React.RefAttributes<HTMLInputElement>>;
