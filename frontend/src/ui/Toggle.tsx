import React from 'react'
import { clsx } from 'clsx'

interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  description?: string
  size?: 'sm' | 'md'
}

export function Toggle({ label, description, size = 'md', className, id, ...props }: ToggleProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  const trackSize  = size === 'sm' ? 'h-4 w-7'  : 'h-5 w-9'
  const thumbSize  = size === 'sm' ? 'h-3 w-3'  : 'h-3.5 w-3.5'
  const thumbShift = size === 'sm' ? 'peer-checked:translate-x-3' : 'peer-checked:translate-x-4'

  return (
    <label
      htmlFor={inputId}
      className={clsx(
        'inline-flex items-start gap-2.5 cursor-pointer select-none',
        props.disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <div className="relative flex-shrink-0 mt-0.5">
        <input type="checkbox" id={inputId} className="peer sr-only" {...props} />
        <div
          className={clsx(
            trackSize,
            'rounded-full border border-border bg-surface-3 transition-colors',
            'peer-checked:bg-primary peer-checked:border-primary',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1',
          )}
        />
        <div
          className={clsx(
            thumbSize,
            'absolute top-[3px] left-[3px] rounded-full bg-white shadow-sm transition-transform',
            thumbShift,
          )}
        />
      </div>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && <span className="text-sm text-text-primary leading-5">{label}</span>}
          {description && <span className="text-xs text-text-secondary">{description}</span>}
        </div>
      )}
    </label>
  )
}
