import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={twMerge(clsx(
          'w-full rounded-md border bg-white text-sm text-text-primary placeholder:text-text-tertiary',
          'px-3 py-2 h-36 min-h-36 resize-y',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          'disabled:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60',
          error ? 'border-danger focus:ring-danger' : 'border-border',
          className,
        ))}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-secondary">{hint}</p>}
    </div>
  )
}
