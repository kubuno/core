import React from 'react';
/** One choice of a `RadioGroup`. */
export interface RadioOption {
    value: string;
    label: string;
    /** A second line under the label. */
    description?: string;
    disabled?: boolean;
}
export interface RadioGroupProps {
    options: RadioOption[];
    /** The chosen option's value (`''` when none). */
    value?: string;
    onChange?: (value: string) => void;
    /** `vertical` (default): one option per line; `horizontal`: side by side, wrapping. */
    orientation?: 'vertical' | 'horizontal';
    disabled?: boolean;
    className?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
}
/**
 * A set of exclusive options built on the `@ui` `Radio` (the `.kbview` `RadioGroup`): the single shared version
 * of the radio list the modules' settings pages each defined locally. One native radio group (a shared `name`),
 * so Tab enters it once and the arrow keys move the choice; `role="radiogroup"` names it for screen readers.
 */
export declare const RadioGroup: React.ForwardRefExoticComponent<RadioGroupProps & React.RefAttributes<HTMLDivElement>>;
