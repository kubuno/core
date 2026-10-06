import { type ReactNode } from 'react';
import type { TFunction } from 'i18next';
export interface ComboboxOption {
    value: string;
    label: string;
    /** Second line, shown dimmed under the label. Also searched. */
    description?: string;
    icon?: ReactNode;
    /** Optional group heading; consecutive options sharing one are banded together. */
    group?: string;
    disabled?: boolean;
    /** Extra searchable terms (synonyms, codes) that are not displayed. */
    keywords?: string;
}
export interface ComboboxProps {
    value: string | null;
    onChange: (value: string) => void;
    options: ComboboxOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    /** Shown in place of the list when the query matches nothing. */
    emptyLabel?: string;
    disabled?: boolean;
    /** Adds a clear button on the trigger once something is selected. */
    clearable?: boolean;
    onClear?: () => void;
    /** Fixed trigger width (px or CSS length). Omit to fill the parent. */
    width?: number | string;
    /** Max height of the scrollable list, in px. */
    maxHeight?: number;
    name?: string;
    id?: string;
    'aria-label'?: string;
    className?: string;
    t?: TFunction;
}
/**
 * Combobox — selection in a LONG list: a trigger, a filter field and a listbox.
 *
 * `Dropdown` is the right control for a handful of fixed choices; it has no
 * filter, so it collapses on real data (the admin currently feeds it the ~600
 * IANA timezones). This component adds the search field, keyboard navigation,
 * and — the part that is routinely got wrong — DIACRITIC-INSENSITIVE matching:
 * typing `unites` finds « Unités », and typing `Unités` finds `unites`, because
 * both sides are folded through NFD + diacritic stripping (see `foldText`).
 *
 * Accessibility follows the ARIA 1.2 combobox pattern: the FILTER INPUT owns
 * `role="combobox"`, the popup is a `role="listbox"`, and the active option is
 * pointed at by `aria-activedescendant` — focus never leaves the input, so what
 * the user types keeps going to the field while the arrow keys move the
 * highlight. Options are `role="option"` with `aria-selected`.
 *
 * On mobile the popup would be a cramped anchored panel over the keyboard, so
 * the hierarchy is rethought instead of shrunk: the list becomes a `MobileSheet`
 * with the search field pinned at its top and thumb-sized rows.
 */
export declare function Combobox({ value, onChange, options, placeholder, searchPlaceholder, emptyLabel, disabled, clearable, onClear, width, maxHeight, name, id, className, t, 'aria-label': ariaLabel, }: ComboboxProps): import("react").JSX.Element;
