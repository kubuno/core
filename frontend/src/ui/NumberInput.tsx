import React, { useCallback } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  label?: string
  error?: string
  hint?: string
  className?: string
  id?: string
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  label,
  error,
  hint,
  className,
  id,
}: NumberInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  const clamp = useCallback((v: number) => {
    if (min !== undefined && v < min) return min
    if (max !== undefined && v > max) return max
    return v
  }, [min, max])

  const increment = () => onChange(clamp(value + step))
  const decrement = () => onChange(clamp(value - step))

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value)
    if (!isNaN(raw)) onChange(clamp(raw))
  }

  const atMin = min !== undefined && value <= min
  const atMax = max !== undefined && value >= max

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <div
        className={clsx(
          'inline-flex items-stretch h-9 rounded-md border bg-white overflow-hidden',
          'focus-within:ring-2 focus-within:ring-primary focus-within:border-primary',
          error ? 'border-danger focus-within:ring-danger' : 'border-border',
          disabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
      >
        <input
          id={inputId}
          type="number"
          value={value}
          onChange={handleInput}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={clsx(
            'flex-1 min-w-0 px-3 text-sm text-text-primary bg-transparent',
            'focus:outline-none',
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          )}
        />
        <div className="flex flex-col border-l border-border w-6 flex-shrink-0">
          <button
            type="button"
            tabIndex={-1}
            onClick={increment}
            disabled={disabled || atMax}
            className={clsx(
              'flex-1 flex items-center justify-center border-b border-border',
              'text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            <ChevronUp size={11} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={decrement}
            disabled={disabled || atMin}
            className={clsx(
              'flex-1 flex items-center justify-center',
              'text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            <ChevronDown size={11} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-secondary">{hint}</p>}
    </div>
  )
}
