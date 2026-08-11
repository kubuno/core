import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { MentionsConfig } from './mention/types'
import { MentionInput, type MentionModel } from './mention/MentionInput'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  /**
   * Opt-in @mention support. ABSENT (or `enabled` falsy) → a plain native
   * `<input>`, 100 % unchanged. When enabled the field becomes a chips-field:
   * picked mentions render as removable chips beside the input and the value is
   * exposed via `onMentionsChange` as a `{ text, mentions }` model (the native
   * `value`/`onChange` no longer describe the full field).
   */
  mentions?: MentionsConfig
  /** Called with the `{ text, mentions }` model when `mentions` is enabled. */
  onMentionsChange?: (model: MentionModel) => void
  /** Initial `{ text, mentions }` model when `mentions` is enabled. */
  defaultMentionValue?: MentionModel
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  id,
  mentions,
  onMentionsChange,
  defaultMentionValue,
  ...props
}: InputProps, ref) {
  const inputId = id ?? (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  // Mention variant: a chips-field replaces the native input. Everything else
  // (label / error / hint chrome) stays identical.
  if (mentions?.enabled) {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <MentionInput
          mentions={mentions}
          placeholder={props.placeholder}
          disabled={props.disabled}
          className={twMerge(clsx(error && 'border-danger focus-within:ring-danger', className))}
          defaultValue={defaultMentionValue}
          onMentionsChange={onMentionsChange}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-text-secondary">{hint}</p>}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-text-secondary pointer-events-none">{leftIcon}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={twMerge(clsx(
            'w-full rounded-md border bg-white text-sm text-text-primary placeholder:text-text-tertiary',
            'px-3 py-2 h-9',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            'disabled:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-danger focus:ring-danger' : 'border-border',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            className,
          ))}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 text-text-secondary pointer-events-none">{rightIcon}</span>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-secondary">{hint}</p>}
    </div>
  )
})
