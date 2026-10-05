import React, { useId } from 'react'

import { cn } from './cn'
import { Radio } from './Radio'

/** One choice of a `RadioGroup`. */
export interface RadioOption {
  value: string
  label: string
  /** A second line under the label. */
  description?: string
  disabled?: boolean
}

export interface RadioGroupProps {
  options: RadioOption[]
  /** The chosen option's value (`''` when none). */
  value?: string
  onChange?: (value: string) => void
  /** `vertical` (default): one option per line; `horizontal`: side by side, wrapping. */
  orientation?: 'vertical' | 'horizontal'
  disabled?: boolean
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

/**
 * A set of exclusive options built on the `@ui` `Radio` (the `.kbview` `RadioGroup`): the single shared version
 * of the radio list the modules' settings pages each defined locally. One native radio group (a shared `name`),
 * so Tab enters it once and the arrow keys move the choice; `role="radiogroup"` names it for screen readers.
 */
export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  { options, value = '', onChange, orientation = 'vertical', disabled, className, ...aria },
  ref,
) {
  const name = useId()
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-disabled={disabled || undefined}
      className={cn(orientation === 'horizontal' ? 'flex flex-wrap items-start gap-x-6 gap-y-2' : 'flex flex-col items-start gap-2', className)}
      {...aria}
    >
      {options.map((opt) => (
        <Radio
          key={opt.value}
          name={name}
          checked={value === opt.value}
          disabled={disabled || opt.disabled}
          onChange={(checked) => { if (checked && value !== opt.value) onChange?.(opt.value) }}
          label={opt.label}
          description={opt.description}
        />
      ))}
    </div>
  )
})

RadioGroup.displayName = 'RadioGroup'
